enum TitanGenerativeType { job, customer, worker, quote, invoice, payment, summary, recurringService, notice }

class TitanGenerativeItem {
  final TitanGenerativeType type;
  final String title;
  final String? subtitle;
  final Map<String, String> fields;
  final List<String> actions;
  final Map<String, dynamic> context;

  const TitanGenerativeItem({
    required this.type,
    required this.title,
    this.subtitle,
    this.fields = const {},
    this.actions = const [],
    this.context = const {},
  });

  factory TitanGenerativeItem.fromJson(Map<String, dynamic> json) {
    final rawType = (json['type'] ?? 'notice').toString();
    final type = TitanGenerativeType.values.firstWhere(
      (value) => value.name == rawType,
      orElse: () => TitanGenerativeType.notice,
    );
    return TitanGenerativeItem(
      type: type,
      title: (json['title'] ?? '').toString(),
      subtitle: json['subtitle']?.toString(),
      fields: Map<String, String>.from((json['fields'] as Map?) ?? const {}),
      actions: List<String>.from((json['actions'] as List?) ?? const []),
      context: Map<String, dynamic>.from((json['context'] as Map?) ?? const {}),
    );
  }
}
