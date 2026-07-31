import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../services/p2p_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _editProfile(BuildContext context, P2PService p2p) async {
    final TextEditingController _usernameController = TextEditingController(text: p2p.profile?.username);
    String _avatarBase64 = p2p.profile?.avatarBase64 ?? '';

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Edit Profile'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () async {
                        final picker = ImagePicker();
                        final XFile? image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 50, maxWidth: 200, maxHeight: 200);
                        if (image != null) {
                          final bytes = await image.readAsBytes();
                          setState(() {
                            _avatarBase64 = base64Encode(bytes);
                          });
                        }
                      },
                      child: CircleAvatar(
                        radius: 40,
                        backgroundColor: Theme.of(context).primaryColor.withValues(alpha: 0.2),
                        backgroundImage: _avatarBase64.isNotEmpty ? MemoryImage(base64Decode(_avatarBase64)) : null,
                        child: _avatarBase64.isEmpty ? Icon(Icons.camera_alt, color: Theme.of(context).primaryColor) : null,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _usernameController,
                      decoration: const InputDecoration(labelText: 'Username'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    p2p.updateProfile(_usernameController.text.trim(), _avatarBase64);
                    Navigator.pop(context);
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Identity'),
        actions: [
          Consumer<P2PService>(
            builder: (context, p2p, child) {
              return IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => _editProfile(context, p2p),
              );
            },
          ),
        ],
      ),
      body: Consumer<P2PService>(
        builder: (context, p2p, child) {
          if (!p2p.isInitialized || p2p.isStarting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (p2p.error != null) {
            return Center(child: Text('Error: ${p2p.error}', style: const TextStyle(color: Colors.red)));
          }

          final peerId = p2p.peerId ?? 'Unknown';
          final profile = p2p.profile;
          final localMessages = p2p.localMessages;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 32),
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Theme.of(context).primaryColor.withValues(alpha: 0.2),
                  backgroundImage: profile != null && profile.avatarBase64.isNotEmpty
                      ? MemoryImage(base64Decode(profile.avatarBase64))
                      : null,
                  child: profile == null || profile.avatarBase64.isEmpty
                      ? Icon(Icons.account_circle, size: 64, color: Theme.of(context).primaryColor)
                      : null,
                ),
                const SizedBox(height: 16),
                Text(
                  profile?.username ?? 'Anonymous',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Text('Decentralized ID', style: TextStyle(color: Colors.grey)),
                        const SizedBox(height: 8),
                        Text(
                          peerId,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'monospace',
                            color: Theme.of(context).colorScheme.secondary,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: peerId));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('PeerID copied to clipboard!')),
                            );
                          },
                          icon: const Icon(Icons.copy),
                          label: const Text('Copy ID'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                const Divider(),
                const SizedBox(height: 16),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Local Posts',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 16),
                if (localMessages.isEmpty)
                  const Center(
                    child: Text(
                      'No posts yet.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: localMessages.length,
                    itemBuilder: (context, index) {
                      final msg = localMessages[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(msg.content, style: const TextStyle(fontSize: 16)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
