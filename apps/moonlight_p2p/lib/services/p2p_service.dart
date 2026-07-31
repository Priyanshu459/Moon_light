import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import '../src/rust/api/p2p.dart' as rust;
import '../src/rust/frb_generated.dart';

class P2PService extends ChangeNotifier {
  bool _isInitialized = false;
  bool _isStarting = false;
  String? _peerId;
  String? _error;
  
  rust.Profile? _profile;
  List<rust.P2pMessage> _messages = [];

  bool get isInitialized => _isInitialized;
  bool get isStarting => _isStarting;
  String? get peerId => _peerId;
  String? get error => _error;
  rust.Profile? get profile => _profile;
  List<rust.P2pMessage> get messages => _messages;
  List<rust.P2pMessage> get localMessages => _messages.where((m) => m.peerId == _peerId).toList();

  /// Initialize the Rust bridge and DB
  Future<void> initBridge() async {
    if (_isInitialized) return;
    
    try {
      await RustLib.init();
      
      // Init SQLite DB
      final dir = await getApplicationDocumentsDirectory();
      final dbPath = '${dir.path}/moonlight_p2p.sqlite';
      await rust.initDb(path: dbPath);
      
      // Load initial profile and messages
      _profile = await rust.getProfile();
      _messages = await rust.getAllMessages();
      
      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to init Rust Bridge or DB: $e';
      notifyListeners();
    }
  }

  /// Start the P2P node
  Future<void> startNode() async {
    if (!_isInitialized) await initBridge();
    if (_isStarting || _peerId != null) return;

    _isStarting = true;
    _error = null;
    notifyListeners();

    try {
      final stream = rust.startNode();
      stream.listen((event) {
        if (event.startsWith("INIT|")) {
          _peerId = event.substring(5);
          _isStarting = false;
          notifyListeners();
        } else {
          // It's a JSON message from the network
          try {
            final map = jsonDecode(event);
            final newMsg = rust.P2pMessage(
              peerId: map['peer_id'],
              username: map['username'],
              avatarBase64: map['avatar_base64'],
              content: map['content'],
              timestamp: map['timestamp'],
            );
            _messages.insert(0, newMsg);
            notifyListeners();
          } catch (e) {
            print("Failed to decode incoming message: $e");
          }
        }
      }, onError: (e) {
        _error = 'Stream error: $e';
        _isStarting = false;
        notifyListeners();
      });
    } catch (e) {
      _error = 'Failed to start node: $e';
      _isStarting = false;
      notifyListeners();
    }
  }

  Future<void> broadcastMessage(String msg) async {
    if (_profile == null) return;
    
    await rust.broadcastMessage(content: msg);
    
    // Also add to local feed optimistically
    final newMsg = rust.P2pMessage(
      peerId: _peerId ?? 'Me',
      username: _profile!.username,
      avatarBase64: _profile!.avatarBase64,
      content: msg,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    
    _messages.insert(0, newMsg);
    notifyListeners();
  }

  Future<void> updateProfile(String username, String avatarBase64) async {
    await rust.updateProfile(username: username, avatarBase64: avatarBase64);
    _profile = await rust.getProfile();
    notifyListeners();
  }
}
