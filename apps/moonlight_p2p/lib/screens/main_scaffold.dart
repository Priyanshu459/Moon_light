import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'feed_screen.dart';
import 'profile_screen.dart';
import '../services/p2p_service.dart';

class MainScaffold extends StatefulWidget {
  const MainScaffold({super.key});

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    FeedScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    // Start node on app launch
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<P2PService>().startNode();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.public),
            label: 'Network',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Identity',
          ),
        ],
      ),
    );
  }
}
