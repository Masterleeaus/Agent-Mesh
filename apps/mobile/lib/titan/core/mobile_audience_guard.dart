class MobileAudienceGuard {
  const MobileAudienceGuard();

  void validate({
    required String surface,
    required String actorId,
    required Map<String, dynamic> projection,
  }) {
    if (surface == 'go') {
      if (projection['worker_id'] != actorId ||
          (projection['assignment_revision']?.toString().trim().isEmpty ?? true)) {
        throw StateError('go-assignment-context-required');
      }
    }
    if (surface == 'hub') {
      if (projection['customer_safe'] != true ||
          (projection['customer_id']?.toString().trim().isEmpty ?? true) ||
          projection['relationship_scope'] is! List ||
          (projection['relationship_scope'] as List).isEmpty) {
        throw StateError('hub-customer-safe-scope-required');
      }
      if (projection['internal_notes'] != null ||
          projection['margin'] != null ||
          projection['workforce_private'] != null) {
        throw StateError('hub-private-data-forbidden');
      }
    }
  }
}
