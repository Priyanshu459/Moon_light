use libp2p::{
    futures::StreamExt,
    identity,
    kad::{store::MemoryStore, Behaviour as Kademlia, Config as KademliaConfig},
    noise, ping, relay, gossipsub,
    swarm::{NetworkBehaviour, SwarmEvent},
    tcp, yamux, PeerId, Multiaddr,
};
use log::info;
use std::error::Error;
use std::time::Duration;
use std::fs;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

#[derive(NetworkBehaviour)]
struct RelayBehaviour {
    relay: relay::Behaviour,
    ping: ping::Behaviour,
    identify: libp2p::identify::Behaviour,
    kad: Kademlia<MemoryStore>,
    gossipsub: gossipsub::Behaviour,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    env_logger::init();
    info!("Starting Moonlight P2P Relay Node...");

    // Load or generate static keypair
    let key_path = "relay_keypair.bin";
    let local_key = if let Ok(bytes) = fs::read(key_path) {
        identity::Keypair::from_protobuf_encoding(&bytes).unwrap_or_else(|_| identity::Keypair::generate_ed25519())
    } else {
        let key = identity::Keypair::generate_ed25519();
        if let Ok(bytes) = key.to_protobuf_encoding() {
            let _ = fs::write(key_path, bytes);
        }
        key
    };

    let local_peer_id = PeerId::from(local_key.public());
    info!("Local Peer ID: {}", local_peer_id);

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
        .with_behaviour(|key| {
            let identify = libp2p::identify::Behaviour::new(
                libp2p::identify::Config::new("/moonlight/1.0.0".to_string(), key.public()),
            );

            let ping = ping::Behaviour::new(ping::Config::new().with_interval(Duration::from_secs(15)));

            let relay = relay::Behaviour::new(
                local_peer_id,
                relay::Config {
                    max_reservations: 1024,
                    max_reservations_per_peer: 100,
                    max_circuits: 1024,
                    max_circuits_per_peer: 100,
                    reservation_duration: Duration::from_secs(60 * 60),
                    reservation_rate_limiters: vec![],
                    circuit_src_rate_limiters: vec![],
                    max_circuit_duration: Duration::from_secs(60 * 2),
                    max_circuit_bytes: 1024 * 1024 * 8, // 8 MB
                },
            );

            let kad_config = KademliaConfig::new(libp2p::StreamProtocol::new("/moonlight/kad/1.0.0"));
            let store = MemoryStore::new(local_peer_id);
            let mut kad = Kademlia::with_config(local_peer_id, store, kad_config);
            kad.set_mode(Some(libp2p::kad::Mode::Server));

            // Configure Gossipsub for the Relay Node
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

            // Don't limit peer scores for the bootstrap node
            let params = gossipsub::PeerScoreParams::default();
            let thresholds = gossipsub::PeerScoreThresholds::default();
            gossipsub.with_peer_score(params, thresholds).expect("Valid score params");

            RelayBehaviour { relay, ping, identify, kad, gossipsub }
        })?
        .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(60)))
        .build();

    // Subscribe to the global feed
    let topic = gossipsub::IdentTopic::new("moonlight-global-feed");
    let _ = swarm.behaviour_mut().gossipsub.subscribe(&topic);

    // Listen on WebSocket
    swarm.listen_on("/ip4/0.0.0.0/tcp/4001/ws".parse()?)?;

    loop {
        match swarm.select_next_some().await {
            SwarmEvent::NewListenAddr { address, .. } => {
                info!("Listening on {:?}", address);
            }
            SwarmEvent::Behaviour(RelayBehaviourEvent::Identify(libp2p::identify::Event::Received { peer_id, info, connection_id: _ })) => {
                for addr in info.listen_addrs {
                    swarm.behaviour_mut().kad.add_address(&peer_id, addr);
                }
            }
            SwarmEvent::Behaviour(RelayBehaviourEvent::Gossipsub(gossipsub::Event::Message { message_id: id, .. })) => {
                info!("Relayed message: {}", id);
            }
            event => {
                // info!("Swarm event: {:?}", event);
            }
        }
    }
}
