import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/p2p_service.dart';

class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  void _showComposeModal(BuildContext context) {
    final TextEditingController _controller = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Broadcast to Network',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _controller,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'What\'s happening in the decentralized world?',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  final text = _controller.text.trim();
                  if (text.isNotEmpty) {
                    context.read<P2PService>().broadcastMessage(text);
                    Navigator.pop(context);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Broadcast'),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Moonlight'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      body: Consumer<P2PService>(
        builder: (context, p2p, child) {
          // Show spinner only if DB itself isn't ready yet (fast, ~100ms)
          if (!p2p.isInitialized) {
            return const Center(child: CircularProgressIndicator());
          }
          return Column(
            children: [
              if (p2p.isStarting)
                Container(
                  width: double.infinity,
                  color: Colors.deepPurple.withValues(alpha: 0.15),
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                  child: const Row(
                    children: [
                      SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
                      SizedBox(width: 10),
                      Text('Starting P2P node…', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                )
              else if (!p2p.relayConnected)
                Container(
                  width: double.infinity,
                  color: Colors.orange.withValues(alpha: 0.12),
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                  child: const Row(
                    children: [
                      SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.orange)),
                      SizedBox(width: 10),
                      Text('Connecting to relay…', style: TextStyle(fontSize: 12, color: Colors.orange)),
                    ],
                  ),
                )
              else
                Container(
                  width: double.infinity,
                  color: Colors.green.withValues(alpha: 0.12),
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                  child: const Row(
                    children: [
                      Icon(Icons.wifi_tethering, size: 14, color: Colors.green),
                      SizedBox(width: 8),
                      Text('Connected to global relay ✓', style: TextStyle(fontSize: 12, color: Colors.green)),
                    ],
                  ),
                ),
              if (p2p.error != null)
                Container(
                  width: double.infinity,
                  color: Colors.red.withValues(alpha: 0.15),
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                  child: Text('Network error: ${p2p.error}', style: const TextStyle(fontSize: 12, color: Colors.redAccent)),
                ),
              Expanded(
                child: _buildFeed(context, p2p),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showComposeModal(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildFeed(BuildContext context, P2PService p2p) {
    final messages = p2p.messages;
    if (messages.isEmpty) {
      return const Center(
        child: Text(
          'No messages yet.\nBe the first to broadcast!',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final msg = messages[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Theme.of(context).primaryColor.withValues(alpha: 0.2),
                      backgroundImage: msg.avatarBase64.isNotEmpty
                          ? MemoryImage(base64Decode(msg.avatarBase64))
                          : null,
                      child: msg.avatarBase64.isEmpty
                          ? Icon(Icons.person, color: Theme.of(context).primaryColor)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            msg.username.isNotEmpty ? msg.username : 'Anonymous',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            msg.peerId,
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(msg.content, style: const TextStyle(fontSize: 16)),
              ],
            ),
          ),
        );
      },
    );
  }
}
