import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'services/p2p_service.dart';
import 'screens/main_scaffold.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MoonlightApp());
}

class MoonlightApp extends StatelessWidget {
  const MoonlightApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => P2PService()),
      ],
      child: MaterialApp(
        title: 'Moonlight P2P',
        theme: MoonlightTheme.darkTheme,
        home: const MainScaffold(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
