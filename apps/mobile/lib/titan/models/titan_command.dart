import 'dart:convert';

class TitanCommand {
  final String id;
  final String capability;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  final bool requiresOnline;

  TitanCommand({required this.id, required this.capability, required this.payload, required this.createdAt, this.requiresOnline = false});

  Map<String, dynamic> toJson() => {'id': id, 'capability': capability, 'payload': payload, 'created_at': createdAt.toIso8601String(), 'requires_online': requiresOnline};
  factory TitanCommand.fromJson(Map<String,dynamic> j) => TitanCommand(id:j['id'], capability:j['capability'], payload:Map<String,dynamic>.from(j['payload'] ?? {}), createdAt:DateTime.parse(j['created_at']), requiresOnline:j['requires_online'] == true);
  String encode() => jsonEncode(toJson());
}
