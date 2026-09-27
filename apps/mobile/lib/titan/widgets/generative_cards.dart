import 'package:flutter/material.dart';
import '../models/generative_item.dart';

class TitanGenerativeCard extends StatelessWidget {
  final TitanGenerativeItem item;
  final ValueChanged<String>? onAction;
  const TitanGenerativeCard({super.key, required this.item, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(_icon(item.type), size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
          ]),
          if (item.subtitle != null) ...[const SizedBox(height: 4), Text(item.subtitle!)],
          if (item.fields.isNotEmpty) ...[
            const SizedBox(height: 10),
            ...item.fields.entries.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                SizedBox(width: 90, child: Text(e.key, style: Theme.of(context).textTheme.bodySmall)),
                Expanded(child: Text(e.value, style: const TextStyle(fontWeight: FontWeight.w500))),
              ]),
            )),
          ],
          if (item.actions.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: item.actions.map((a) => TextButton(onPressed: () => onAction?.call(a), child: Text(a))).toList()),
          ]
        ]),
      ),
    );
  }

  IconData _icon(TitanGenerativeType type) {
    switch (type) {
      case TitanGenerativeType.job: return Icons.work_outline;
      case TitanGenerativeType.customer: return Icons.person_outline;
      case TitanGenerativeType.worker: return Icons.badge_outlined;
      case TitanGenerativeType.quote: return Icons.request_quote_outlined;
      case TitanGenerativeType.invoice: return Icons.receipt_long_outlined;
      case TitanGenerativeType.payment: return Icons.payments_outlined;
      case TitanGenerativeType.summary: return Icons.receipt_long_outlined;
      case TitanGenerativeType.recurringService: return Icons.repeat;
      case TitanGenerativeType.notice: return Icons.auto_awesome_outlined;
    }
  }
}
