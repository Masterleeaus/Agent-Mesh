class TitanScheduleJob {
  final String id, title, customer, address, worker, status;
  final DateTime start;
  final Duration duration;
  const TitanScheduleJob({required this.id, required this.title, required this.customer, required this.address, required this.worker, required this.status, required this.start, this.duration = const Duration(hours: 2)});
  DateTime get end => start.add(duration);
}
