use flutter_rust_bridge::frb;
use libp2p::{
    futures::StreamExt,
    gossipsub, identity, mdns, noise, tcp, yamux, PeerId, ping, identify, relay, dcutr, Multiaddr,
    kad::{store::MemoryStore, Behaviour as Kademlia, Config as KademliaConfig},
    swarm::{NetworkBehaviour, SwarmEvent},
};
use log::info;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::time::Duration;
use tokio::sync::Mutex as AsyncMutex;
use std::sync::{Arc, Mutex as StdMutex};
use once_cell::sync::Lazy;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

// Database Path
static DB_PATH: Lazy<StdMutex<Option<String>>> = Lazy::new(|| StdMutex::new(None));

// Node State
static NODE_RUNNING: Lazy<Arc<AsyncMutex<bool>>> = Lazy::new(|| Arc::new(AsyncMutex::new(false)));
static COMMAND_SENDER: Lazy<AsyncMutex<Option<tokio::sync::mpsc::Sender<String>>>> = Lazy::new(|| AsyncMutex::new(None));
static MSG_SINK: Lazy<AsyncMutex<Option<crate::frb_generated::StreamSink<String>>>> = Lazy::new(|| AsyncMutex::new(None));
static PEER_ID: Lazy<AsyncMutex<Option<String>>> = Lazy::new(|| AsyncMutex::new(None));

#[derive(Serialize, Deserialize, Clone)]
pub struct Profile {
    pub username: String,
    pub avatar_base64: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct P2pMessage {
    pub peer_id: String,
    pub username: String,
    pub avatar_base64: String,
    pub content: String,
    pub timestamp: i64,
}

#[derive(NetworkBehaviour)]
struct MoonlightBehaviour {
    gossipsub: gossipsub::Behaviour,
    mdns: mdns::tokio::Behaviour,
    kad: Kademlia<MemoryStore>,
    identify: identify::Behaviour,
    ping: ping::Behaviour,
    relay_client: relay::client::Behaviour,
    dcutr: dcutr::Behaviour,
}

#[frb(sync)]
pub fn init_logger() {
    let _ = env_logger::builder().filter_level(log::LevelFilter::Info).try_init();
}

pub fn init_db(path: String) -> anyhow::Result<()> {
    let conn = Connection::open(&path)?;
    
    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY,
            keypair BLOB NOT NULL,
            username TEXT NOT NULL,
            avatar_base64 TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            peer_id TEXT NOT NULL,
            username TEXT NOT NULL,
            avatar_base64 TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )",
        [],
    )?;

    // Store DB path
    if let Ok(mut db_path) = DB_PATH.lock() {
        *db_path = Some(path);
    }
    
    Ok(())
}

pub fn update_profile(username: String, avatar_base64: String) -> anyhow::Result<()> {
    let path = DB_PATH.lock().unwrap().clone().unwrap_or_default();
    let conn = Connection::open(&path)?;
    conn.execute(
        "UPDATE profile SET username = ?1, avatar_base64 = ?2 WHERE id = 1",
        params![username, avatar_base64],
    )?;
    Ok(())
}

pub fn get_profile() -> anyhow::Result<Profile> {
    let path = DB_PATH.lock().unwrap().clone().unwrap_or_default();
    let conn = Connection::open(&path)?;
    
    let mut stmt = conn.prepare("SELECT username, avatar_base64 FROM profile WHERE id = 1")?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        Ok(Profile {
            username: row.get(0)?,
            avatar_base64: row.get(1)?,
        })
    } else {
        Ok(Profile {
            username: "Anonymous".to_string(),
            avatar_base64: "".to_string(),
        })
    }
}

pub fn get_all_messages() -> anyhow::Result<Vec<P2pMessage>> {
    let path = DB_PATH.lock().unwrap().clone().unwrap_or_default();
    if path.is_empty() {
        return Ok(vec![]);
    }
    let conn = Connection::open(&path)?;
    
    let mut stmt = conn.prepare("SELECT peer_id, username, avatar_base64, content, timestamp FROM messages ORDER BY timestamp DESC")?;
    let messages = stmt.query_map([], |row| {
        Ok(P2pMessage {
            peer_id: row.get(0)?,
            username: row.get(1)?,
            avatar_base64: row.get(2)?,
            content: row.get(3)?,
            timestamp: row.get(4)?,
        })
    })?
    .filter_map(Result::ok)
    .collect();
    
    Ok(messages)
}

fn save_message_to_db(msg: &P2pMessage) -> anyhow::Result<()> {
    let path = DB_PATH.lock().unwrap().clone().unwrap_or_default();
    if path.is_empty() { return Ok(()); }
    let conn = Connection::open(&path)?;
    conn.execute(
        "INSERT INTO messages (peer_id, username, avatar_base64, content, timestamp) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![msg.peer_id, msg.username, msg.avatar_base64, msg.content, msg.timestamp],
    )?;
    Ok(())
}

fn get_or_create_keypair() -> anyhow::Result<identity::Keypair> {
    let path = DB_PATH.lock().unwrap().clone().unwrap_or_default();
    let conn = Connection::open(&path)?;
    
    let mut stmt = conn.prepare("SELECT keypair FROM profile WHERE id = 1")?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        let key_bytes: Vec<u8> = row.get(0)?;
        if let Ok(keypair) = identity::Keypair::from_protobuf_encoding(&key_bytes) {
            return Ok(keypair);
        }
    }
    
    // Generate new if not found or invalid
    let new_key = identity::Keypair::generate_ed25519();
    let encoded = new_key.to_protobuf_encoding()?;
    
    conn.execute(
        "INSERT OR REPLACE INTO profile (id, keypair, username, avatar_base64) VALUES (1, ?1, 'Anonymous', '')",
        params![encoded],
    )?;
    
    Ok(new_key)
}

pub async fn start_node(msg_sink: crate::frb_generated::StreamSink<String>) -> anyhow::Result<String> {
    {
        let mut sink_guard = MSG_SINK.lock().await;
        *sink_guard = Some(msg_sink.clone());
    }

    let mut running = NODE_RUNNING.lock().await;
    if *running {
        if let Some(peer_id) = &*PEER_ID.lock().await {
            let _ = msg_sink.add(format!("INIT|{peer_id}"));
        }
        return Ok("Already running".to_string());
    }
    *running = true;

    // Load or create PeerId
    let local_key = get_or_create_keypair()?;
    let local_peer_id = PeerId::from(local_key.public());
    let peer_id_str = local_peer_id.to_string();
    info!("Local peer id: {local_peer_id}");

    {
        *PEER_ID.lock().await = Some(peer_id_str.clone());
    }

    // Configure GossipSub Peer Scoring to drop bad actors/spammers
    let message_id_fn = |message: &gossipsub::Message| {
        let mut s = DefaultHasher::new();
        message.data.hash(&mut s);
        gossipsub::MessageId::from(s.finish().to_string())
    };

    let gossipsub_config = gossipsub::ConfigBuilder::default()
        .heartbeat_interval(Duration::from_secs(10))
        .validation_mode(gossipsub::ValidationMode::Strict)
        .message_id_fn(message_id_fn)
        .build()
        .expect("Valid config");

    let mut gossipsub = gossipsub::Behaviour::new(
        gossipsub::MessageAuthenticity::Signed(local_key.clone()),
        gossipsub_config,
    ).expect("Valid behaviour");
    
    // Simple peer scoring to ban bad actors
    let params = gossipsub::PeerScoreParams::default();
    let thresholds = gossipsub::PeerScoreThresholds {
        gossip_threshold: -500.0,
        publish_threshold: -1000.0,
        graylist_threshold: -2500.0,
        accept_px_threshold: 1000.0,
        opportunistic_graft_threshold: 20.0,
    };
    gossipsub.with_peer_score(params, thresholds).expect("Valid score params");

    // Setup Swarm with ConnectionLimits to mitigate Eclipse attacks
    let mut swarm = libp2p::SwarmBuilder::with_existing_identity(local_key.clone())
        .with_tokio()
        .with_tcp(
            tcp::Config::default(),
            noise::Config::new,
            yamux::Config::default,
        )?
        .with_websocket(
            noise::Config::new,
            yamux::Config::default,
        ).await?
        .with_relay_client(noise::Config::new, yamux::Config::default)?
        .with_behaviour(|key, relay_client| {
            let mdns = mdns::tokio::Behaviour::new(
                mdns::Config::default(),
                key.public().to_peer_id(),
            )
            .expect("Valid mDNS");

            let identify = identify::Behaviour::new(
                identify::Config::new("/moonlight/1.0.0".to_string(), key.public()),
            );

            let ping = ping::Behaviour::new(ping::Config::new().with_interval(Duration::from_secs(15)));

            let kad_config = KademliaConfig::new(libp2p::StreamProtocol::new("/moonlight/kad/1.0.0"));
            let store = MemoryStore::new(key.public().to_peer_id());
            let kad = Kademlia::with_config(key.public().to_peer_id(), store, kad_config);

            let dcutr = dcutr::Behaviour::new(key.public().to_peer_id());

            MoonlightBehaviour { gossipsub, mdns, kad, identify, ping, relay_client, dcutr }
        })?
        .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(60)))
        .build();

    // Listen on TCP only — QUIC/UDP is unreliable on Android and crashes init with `?`
    if let Err(e) = swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?) {
        log::warn!("TCP listen failed (non-fatal): {:?}", e);
    }

    // Subscribe to global topic
    let topic = gossipsub::IdentTopic::new("moonlight-global-feed");
    swarm.behaviour_mut().gossipsub.subscribe(&topic)?;

    // Dial Bootstrap / Relay Node for Global Discovery
    // Connect to the Relay Node using Secure WebSocket (WSS) via Cloudflare
    let relay_addr: Multiaddr = "/dns4/rooted-feed.online/tcp/443/wss".parse().unwrap();
    info!("Dialing bootstrap node: {}", relay_addr);
    if let Err(e) = swarm.dial(relay_addr.clone()) {
        log::error!("Failed to dial bootstrap node (non-fatal): {:?}", e);
    }

    let _ = msg_sink.add(format!("INIT|{peer_id_str}"));

    let (tx, mut rx) = tokio::sync::mpsc::channel::<String>(100);
    *COMMAND_SENDER.lock().await = Some(tx);

    tokio::spawn(async move {
        loop {
            tokio::select! {
                cmd = rx.recv() => {
                    if let Some(msg_json) = cmd {
                        let topic = gossipsub::IdentTopic::new("moonlight-global-feed");
                        if let Err(e) = swarm.behaviour_mut().gossipsub.publish(topic, msg_json.as_bytes()) {
                            info!("Publish error: {e:?}");
                        }
                    }
                }
                event = swarm.select_next_some() => match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        info!("Listening on {address:?}");
                    }
                    SwarmEvent::Behaviour(MoonlightBehaviourEvent::Mdns(mdns::Event::Discovered(list))) => {
                        for (peer_id, _multiaddr) in list {
                            info!("mDNS discovered a new peer: {peer_id}");
                            swarm.behaviour_mut().gossipsub.add_explicit_peer(&peer_id);
                        }
                    }
                    SwarmEvent::Behaviour(MoonlightBehaviourEvent::Mdns(mdns::Event::Expired(list))) => {
                        for (peer_id, _multiaddr) in list {
                            info!("mDNS discover peer has expired: {peer_id}");
                            swarm.behaviour_mut().gossipsub.remove_explicit_peer(&peer_id);
                        }
                    }
                    SwarmEvent::Behaviour(MoonlightBehaviourEvent::Identify(identify::Event::Received { peer_id, info, .. })) => {
                        // Check if the peer supports relay
                        if info.protocols.contains(&libp2p::StreamProtocol::new("/libp2p/circuit/relay/0.2.0/hop")) {
                            info!("Found relay node: {}", peer_id);
                            
                            // Listen on the relay circuit
                            let relay_addr = "/dns4/relay.rooted-feed.online/tcp/443/wss".parse::<Multiaddr>().unwrap();
                            let circuit_addr = relay_addr
                                .with(libp2p::multiaddr::Protocol::P2p(peer_id))
                                .with(libp2p::multiaddr::Protocol::P2pCircuit);
                            
                            info!("Listening on relay circuit: {}", circuit_addr);
                            if let Err(e) = swarm.listen_on(circuit_addr) {
                                info!("Failed to listen on relay circuit: {:?}", e);
                            }
                        }

                        // Add to Kademlia DHT
                        for addr in info.listen_addrs {
                            swarm.behaviour_mut().kad.add_address(&peer_id, addr);
                        }
                        let _ = swarm.behaviour_mut().kad.bootstrap();
                    }
                    SwarmEvent::Behaviour(MoonlightBehaviourEvent::Gossipsub(gossipsub::Event::Message {
                        propagation_source: _peer_id,
                        message_id: id,
                        message,
                    })) => {
                        let text = String::from_utf8_lossy(&message.data).to_string();
                        info!("Got message: '{text}' with id: {id}");
                        
                        if let Ok(parsed_msg) = serde_json::from_str::<P2pMessage>(&text) {
                            let _ = save_message_to_db(&parsed_msg);
                            if let Some(sink) = &*MSG_SINK.lock().await {
                                // Send parsed msg back as JSON to flutter
                                let _ = sink.add(text);
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    });

    Ok(peer_id_str)
}

pub async fn broadcast_message(content: String) -> anyhow::Result<()> {
    let peer_id = PEER_ID.lock().await.clone().unwrap_or_default();
    let profile = get_profile()?;
    
    let msg = P2pMessage {
        peer_id,
        username: profile.username,
        avatar_base64: profile.avatar_base64,
        content,
        timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)?.as_millis() as i64,
    };
    
    // Save locally
    let _ = save_message_to_db(&msg);
    
    // Broadcast to others
    let msg_json = serde_json::to_string(&msg)?;
    let sender = COMMAND_SENDER.lock().await;
    if let Some(tx) = sender.as_ref() {
        tx.send(msg_json).await?;
    }
    
    Ok(())
}
