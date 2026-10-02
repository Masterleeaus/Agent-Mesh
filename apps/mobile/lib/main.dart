import 'package:flutter/material.dart';
import 'package:titan_zero_mobile/screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TitanApp());
}

class TitanApp extends StatelessWidget {
  const TitanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Titan Zero',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF145A63)),
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}
