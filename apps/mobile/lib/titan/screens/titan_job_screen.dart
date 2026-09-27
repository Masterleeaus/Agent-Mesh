import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/job_detail.dart';
import '../services/titan_gateway.dart';
import 'capture_screen.dart';
import 'titan_commercial_screen.dart';

class TitanJobScreen extends StatefulWidget {
  final TitanGateway gateway;
  final TitanJobDetail job;
  const TitanJobScreen({super.key, required this.gateway, required this.job});
  @override State<TitanJobScreen> createState()=>_TitanJobScreenState();
}
class _TitanJobScreenState extends State<TitanJobScreen> {
  late TitanJobDetail _job;
  final _notes=TextEditingController();
  bool _busy=false;
  @override void initState(){super.initState();_job=widget.job;_notes.text=_job.notes;}
  @override void dispose(){_notes.dispose();super.dispose();}

  Future<void> _transition(String next) async {
    setState(()=>_busy=true);
    try {
      await widget.gateway.command('job.status.transition',{'job_id':_job.id,'from':_job.status,'to':next});
      if(mounted)setState(()=>_job=_job.copyWith(status:next));
    } finally {if(mounted)setState(()=>_busy=false);}
  }
  Future<void> _saveNotes() async {
    await widget.gateway.command('job.notes.update',{'job_id':_job.id,'notes':_notes.text.trim()});
    if(mounted){setState(()=>_job=_job.copyWith(notes:_notes.text.trim()));ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('Notes queued')));}
  }
  Future<void> _toggleCheck(int i,bool? value) async {
    final next=Set<int>.from(_job.completedChecklist);
    value==true?next.add(i):next.remove(i);
    await widget.gateway.command('job.checklist.update',{'job_id':_job.id,'item_index':i,'completed':value==true});
    if(mounted)setState(()=>_job=_job.copyWith(completedChecklist:next));
  }
  Future<void> _call() async {
    final uri=Uri(scheme:'tel',path:_job.phone); if(await canLaunchUrl(uri)) await launchUrl(uri);
  }
  Future<void> _sms() async {
    final uri=Uri(scheme:'sms',path:_job.phone); if(await canLaunchUrl(uri)) await launchUrl(uri);
  }
  Widget _primaryAction(){
    switch(_job.status){
      case 'scheduled': return FilledButton.icon(onPressed:_busy?null:()=>_transition('en_route'),icon:const Icon(Icons.directions_car_outlined),label:const Text('Start travel'));
      case 'en_route': return FilledButton.icon(onPressed:_busy?null:()=>_transition('arrived'),icon:const Icon(Icons.location_on_outlined),label:const Text('Arrived'));
      case 'arrived': return FilledButton.icon(onPressed:_busy?null:()=>_transition('in_progress'),icon:const Icon(Icons.play_arrow),label:const Text('Start job'));
      case 'in_progress': return FilledButton.icon(onPressed:_busy?null:()=>_transition('completed'),icon:const Icon(Icons.check_circle_outline),label:const Text('Complete job'));
      default:return const SizedBox.shrink();
    }
  }
  @override Widget build(BuildContext context)=>Scaffold(
    appBar:AppBar(title:Text(_job.title)),
    body:ListView(padding:const EdgeInsets.all(16),children:[
      Row(children:[Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
        Text(_job.customer,style:Theme.of(context).textTheme.titleLarge),
        Text(_job.address),const SizedBox(height:6),Chip(label:Text(_job.status.replaceAll('_',' ')))
      ])),_primaryAction()]),
      const Divider(height:32),
      Text('Customer',style:Theme.of(context).textTheme.titleMedium),
      ListTile(contentPadding:EdgeInsets.zero,leading:const Icon(Icons.person_outline),title:Text(_job.customer),subtitle:Text(_job.phone),
        trailing:Wrap(children:[IconButton(tooltip:'Call',onPressed:_call,icon:const Icon(Icons.call_outlined)),IconButton(tooltip:'Message',onPressed:_sms,icon:const Icon(Icons.message_outlined))])),
      const SizedBox(height:8),
      Row(children:[
        Expanded(child:OutlinedButton.icon(onPressed:()=>Navigator.push(context,MaterialPageRoute(builder:(_)=>TitanCaptureScreen(jobId:_job.id,gateway:widget.gateway))),icon:const Icon(Icons.camera_alt_outlined),label:const Text('Evidence'))),
        const SizedBox(width:8),
        Expanded(child:OutlinedButton.icon(onPressed:()=>Navigator.push(context,MaterialPageRoute(builder:(_)=>TitanCommercialScreen(gateway:widget.gateway,jobId:_job.id,customer:_job.customer))),icon:const Icon(Icons.receipt_long_outlined),label:const Text('Quote / invoice')))
      ]),
      const SizedBox(height:22),
      Text('Checklist',style:Theme.of(context).textTheme.titleMedium),
      ...List.generate(_job.checklist.length,(i)=>CheckboxListTile(contentPadding:EdgeInsets.zero,value:_job.completedChecklist.contains(i),onChanged:(v)=>_toggleCheck(i,v),title:Text(_job.checklist[i]))),
      const SizedBox(height:12),
      Text('Job notes',style:Theme.of(context).textTheme.titleMedium),
      TextField(controller:_notes,minLines:3,maxLines:6,decoration:const InputDecoration(hintText:'Add field notes…',border:OutlineInputBorder())),
      Align(alignment:Alignment.centerRight,child:TextButton.icon(onPressed:_saveNotes,icon:const Icon(Icons.save_outlined),label:const Text('Save notes'))),
    ]),
  );
}
