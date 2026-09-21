import 'package:flutter/material.dart';
import '../titan/core/titan_session.dart';
import '../titan/services/offline_command_queue.dart';
import '../titan/services/titan_gateway.dart';
import '../titan/models/generative_item.dart';
import '../titan/widgets/generative_cards.dart';
import '../titan/models/map_job.dart';
import '../titan/screens/titan_map_screen.dart';
import '../titan/screens/capture_screen.dart';
import '../titan/screens/titan_schedule_screen.dart';
import '../titan/screens/titan_job_screen.dart';
import '../titan/models/job_detail.dart';
import '../titan/screens/titan_commercial_screen.dart';
import '../titan/screens/titan_customer_screen.dart';
import '../titan/models/customer_record.dart';

class TitanShellScreen extends StatefulWidget {
  const TitanShellScreen({super.key});
  @override State<TitanShellScreen> createState() => _TitanShellScreenState();
}

class _TitanShellScreenState extends State<TitanShellScreen> {
  final _composer = TextEditingController();
  final List<_Turn> _turns = [];
  late final TitanGateway _gateway = LocalMvpTitanGateway(
    const TitanSession(companyId: 'demo-company', actorId: 'demo-actor', deviceId: 'demo-device'),
    OfflineCommandQueue(),
  );
  @override void dispose() { _composer.dispose(); super.dispose(); }

  Future<void> _send() async {
    final text = _composer.text.trim(); if (text.isEmpty) return;
    _composer.clear();
    final items = await _gateway.converse(text);
    if (!mounted) return;
    setState(() => _turns.add(_Turn(text, items)));
  }

  void _quickAsk(String text) {
    final lower = text.toLowerCase();
    if (lower.contains('photo') || lower.contains('scan') || lower.contains('signature') || lower.contains('evidence')) { Navigator.of(context).push(MaterialPageRoute(builder: (_) => TitanCaptureScreen(jobId: 'job-101', gateway: _gateway))); return; }
    if (lower.contains('schedule') || lower.contains('dispatch') || lower.contains('calendar') || lower.contains('reschedule')) { _openSchedule(); return; }
    if (lower.contains('map') || lower.contains('where are') || lower.contains('route') || lower.contains('navigate')) {
      _openJobsMap();
      return;
    }
    _composer.text = text; _send();
  }

  void _handleGeneratedAction(String action, TitanGenerativeItem item) {
    final a = action.toLowerCase();
    final jobId = (item.context['job_id'] ?? 'job-101').toString();
    if (a.contains('customer')) {
      Navigator.of(context).push(MaterialPageRoute(builder:(_)=>TitanCustomerScreen(gateway:_gateway,customer:const TitanCustomerRecord(
        id:'customer-101',name:'Smith Residence',phone:'+61 400 000 000',email:'smith@example.com',
        addresses:[TitanCustomerAddress(label:'Service address',address:'Fitzroy, VIC',latitude:-37.7984,longitude:144.9783)],
        history:[TitanContactEvent(type:'call',summary:'Booking confirmed',when:'Today · 8:40 AM'),TitanContactEvent(type:'message',summary:'Arrival reminder sent',when:'Yesterday · 4:15 PM'),TitanContactEvent(type:'note',summary:'Prefers side gate access',when:'Last job')]
      )))); return;
    }
    if (a.contains('quote') || a.contains('invoice') || a.contains('payment') || a.contains('paid')) {
      Navigator.of(context).push(MaterialPageRoute(builder:(_)=>TitanCommercialScreen(gateway:_gateway,jobId:jobId,customer:item.title)));
      return;
    }
    if (a.contains('open') || a.contains('detail') || a.contains('start job') || a.contains('view job')) {
      _openJob(jobId, item.title, item.subtitle ?? 'Customer');
      return;
    }
    if (a.contains('evidence')) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => TitanCaptureScreen(jobId: jobId, gateway: _gateway)));
      return;
    }
    if (a.contains('schedule') || a.contains('reschedule') || a.contains('dispatch')) { _openSchedule(); return; }
    if (a.contains('map') || a.contains('navigate')) { _openJobsMap(); return; }
    _quickAsk('$action ${item.title}');
  }


  void _openJob(String jobId, String title, String customer) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => TitanJobScreen(
      gateway: _gateway,
      job: TitanJobDetail(
        id: jobId, title: title, customer: customer,
        phone: '+61 400 000 000', address: 'Melbourne, VIC',
        worker: 'Assigned worker', status: 'scheduled',
        checklist: const ['Confirm scope with customer','Complete service checklist','Capture completion evidence'],
      ),
    )));
  }

  void _openSchedule() { Navigator.of(context).push(MaterialPageRoute(builder: (_) => TitanScheduleScreen(gateway: _gateway))); }

  void _openJobsMap() {
    const jobs = <TitanMapJob>[
      TitanMapJob(id: 'job-101', title: 'House cleaning', customer: 'Smith Residence', address: 'Fitzroy, VIC', latitude: -37.7984, longitude: 144.9783, time: '9:00 AM', status: 'scheduled'),
      TitanMapJob(id: 'job-102', title: 'Pressure wash', customer: 'Northside Property', address: 'Northcote, VIC', latitude: -37.7712, longitude: 144.9980, time: '12:30 PM', status: 'scheduled'),
      TitanMapJob(id: 'job-103', title: 'Maintenance', customer: 'Thornbury Client', address: 'Thornbury, VIC', latitude: -37.7582, longitude: 145.0057, time: '3:00 PM', status: 'scheduled'),
    ];
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TitanMapScreen(jobs: jobs)));
  }

  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Titan Zero'), actions: [IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none)), IconButton(onPressed: () {}, icon: const Icon(Icons.person_outline))]),
    body: SafeArea(child: Column(children: [
      _ContextCards(onTap: _quickAsk), const Divider(height: 1),
      Expanded(child: _turns.isEmpty ? const _EmptySurface() : ListView.builder(
        padding: const EdgeInsets.all(12), itemCount: _turns.length,
        itemBuilder: (context, i) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Align(alignment: Alignment.centerRight, child: Container(margin: const EdgeInsets.only(bottom: 10, left: 50), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10), decoration: BoxDecoration(color: Theme.of(context).colorScheme.primaryContainer, borderRadius: BorderRadius.circular(16)), child: Text(_turns[i].text))),
          ..._turns[i].items.map((item) => TitanGenerativeCard(item: item, onAction: (action) => _handleGeneratedAction(action, item))),
        ]),
      )),
      _Composer(controller: _composer, onSend: _send),
    ])),
  );
}

class _Turn { final String text; final List<TitanGenerativeItem> items; const _Turn(this.text, this.items); }

class _ContextCards extends StatelessWidget {
  final ValueChanged<String> onTap; const _ContextCards({required this.onTap});
  @override Widget build(BuildContext context) => SizedBox(height: 104, child: ListView(padding: const EdgeInsets.all(10), scrollDirection: Axis.horizontal, children: [
    _ContextCard(icon: Icons.today_outlined, title: 'Today', value: 'Show today’s jobs', onTap: () => onTap('Show today jobs')),
    _ContextCard(icon: Icons.warning_amber_rounded, title: 'Attention', value: 'What needs attention?', onTap: () => onTap('What needs attention?')),
    _ContextCard(icon: Icons.calendar_month_outlined, title: 'Schedule', value: 'Dispatch today', onTap: () => onTap('Open schedule and dispatch')),
    _ContextCard(icon: Icons.map_outlined, title: 'Map', value: 'Today’s jobs', onTap: () => onTap('Show today jobs map')),
    _ContextCard(icon: Icons.camera_alt_outlined, title: 'Evidence', value: 'Photo · scan · sign', onTap: () => onTap('Capture job evidence')),
    _ContextCard(icon: Icons.auto_awesome_outlined, title: 'Business', value: 'Give me a summary', onTap: () => onTap('Show business summary')),
  ]));
}
class _ContextCard extends StatelessWidget { final IconData icon; final String title,value; final VoidCallback onTap; const _ContextCard({required this.icon,required this.title,required this.value,required this.onTap});
  @override Widget build(BuildContext context) => SizedBox(width: 160, child: Card(child: InkWell(borderRadius: BorderRadius.circular(12), onTap: onTap, child: Padding(padding: const EdgeInsets.all(10), child: Row(children:[Icon(icon),const SizedBox(width:8),Expanded(child:Column(mainAxisAlignment:MainAxisAlignment.center,crossAxisAlignment:CrossAxisAlignment.start,children:[Text(title,style:const TextStyle(fontWeight:FontWeight.w600)),const SizedBox(height:3),Text(value,maxLines:2,overflow:TextOverflow.ellipsis)]))])))))); }
class _EmptySurface extends StatelessWidget { const _EmptySurface(); @override Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children:[Icon(Icons.auto_awesome,size:42,color:Theme.of(context).colorScheme.primary),const SizedBox(height:14),Text('What do you need?',style:Theme.of(context).textTheme.headlineSmall),const SizedBox(height:8),const Text('Ask naturally. Titan returns the job, customer, schedule, invoice or action you need — not another screen.',textAlign:TextAlign.center)]))); }
class _Composer extends StatelessWidget { final TextEditingController controller; final VoidCallback onSend; const _Composer({required this.controller,required this.onSend}); @override Widget build(BuildContext context)=>Padding(padding:const EdgeInsets.fromLTRB(12,8,12,12),child:Row(children:[IconButton(onPressed:(){},icon:const Icon(Icons.add_circle_outline)),Expanded(child:TextField(controller:controller,minLines:1,maxLines:5,textInputAction:TextInputAction.send,onSubmitted:(_)=>onSend(),decoration:const InputDecoration(hintText:'Ask Titan…',border:OutlineInputBorder()))),IconButton(onPressed:(){},icon:const Icon(Icons.mic_none)),IconButton(onPressed:onSend,icon:const Icon(Icons.arrow_upward))])); }
