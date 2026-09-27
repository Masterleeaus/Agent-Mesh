import '../models/generative_item.dart';

/// Temporary local adapter proving the generated-UI contract before Titan API wiring.
List<TitanGenerativeItem> demoGenerativeResponse(String input) {
  final q = input.toLowerCase();
  if (q.contains('job') || q.contains('today') || q.contains('tomorrow')) {
    return const [TitanGenerativeItem(type: TitanGenerativeType.job, title: 'Smith Residence', subtitle: 'Cleaning', fields: {'When': 'Tomorrow · 9:00 AM', 'Worker': 'John', 'Status': 'Scheduled', 'Value': r'$180'}, actions: ['Open job', 'Map', 'Navigate', 'Evidence', 'Reschedule'], context: {'job_id':'job-101','latitude':-37.7984,'longitude':144.9783,'address':'Fitzroy, VIC'}];
  }
  if (q.contains('customer') || q.contains('smith')) {
    return const [TitanGenerativeItem(type:TitanGenerativeType.customer,title:'Smith Residence',subtitle:'Customer',fields:{'Phone':'+61 400 000 000','Email':'smith@example.com','Jobs':'12 completed'},actions:['Open customer','Call','Message'],context:{'customer_id':'customer-101'})];
  }
  if (q.contains('worker') || q.contains('john')) {
    return const [TitanGenerativeItem(type: TitanGenerativeType.worker, title: 'John', subtitle: 'Field worker', fields: {'Today': '3 jobs', 'Next': 'Smith Residence · 9:00 AM', 'Status': 'Available'}, actions: ['View jobs', 'Message'])];
  }
  if (q.contains('recurring') || q.contains('subscription') || q.contains('weekly')) {
    return const [TitanGenerativeItem(type: TitanGenerativeType.recurringService, title: 'Weekly cleaning', subtitle: 'Recurring service', fields: {'Customer': 'Smith Residence', 'Frequency': 'Weekly', 'Next': 'Friday · 9:00 AM', 'Value': r'$180 / visit'}, actions: ['Edit', 'Pause'])];
  }
  if (q.contains('quote')) {
    return const [TitanGenerativeItem(type:TitanGenerativeType.quote,title:'Quote · Smith Residence',subtitle:'Cleaning',fields:{'Status':'Draft','Total':r'$180'},actions:['Send quote','Open job'],context:{'job_id':'job-101'})];
  }
  if (q.contains('payment') || q.contains('paid')) {
    return const [TitanGenerativeItem(type:TitanGenerativeType.payment,title:'Payment · Smith Residence',fields:{'Invoice':'INV-101','Amount':r'$180','Status':'Pending'},actions:['Record payment','Open job'],context:{'job_id':'job-101'})];
  }
  if (q.contains('invoice') || q.contains('summary')) {
    return const [TitanGenerativeItem(type: TitanGenerativeType.summary, title: 'Job summary', fields: {'Customer': 'Smith Residence', 'Service': 'Cleaning', 'Total': r'$180', 'Payment': 'Pending'}, actions: ['Create invoice', 'Mark paid'])];
  }
  return [TitanGenerativeItem(type: TitanGenerativeType.notice, title: 'Titan understood', subtitle: input, fields: const {'Mode': 'Local MVP contract'}, actions: const ['Dismiss'])];
}
