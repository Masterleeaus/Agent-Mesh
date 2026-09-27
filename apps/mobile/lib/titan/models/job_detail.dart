class TitanJobDetail {
  final String id, title, customer, phone, address, worker, status, notes;
  final List<String> checklist;
  final Set<int> completedChecklist;
  const TitanJobDetail({
    required this.id, required this.title, required this.customer,
    required this.phone, required this.address, required this.worker,
    required this.status, this.notes = '', this.checklist = const [],
    this.completedChecklist = const {},
  });
  TitanJobDetail copyWith({String? status, String? notes, Set<int>? completedChecklist}) =>
    TitanJobDetail(id:id,title:title,customer:customer,phone:phone,address:address,
      worker:worker,status:status??this.status,notes:notes??this.notes,
      checklist:checklist,completedChecklist:completedChecklist??this.completedChecklist);
}
