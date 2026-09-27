import 'package:flutter/material.dart';
import '../models/schedule_job.dart';
import '../services/titan_gateway.dart';
import '../models/job_detail.dart';
import 'titan_job_screen.dart';

class TitanScheduleScreen extends StatefulWidget {
  final TitanGateway gateway;
  const TitanScheduleScreen({super.key, required this.gateway});
  @override State<TitanScheduleScreen> createState() => _TitanScheduleScreenState();
}
class _TitanScheduleScreenState extends State<TitanScheduleScreen> {
  late DateTime _day;
  late List<TitanScheduleJob> _jobs;
  @override void initState(){super.initState();_day=DateTime.now();_jobs=_seed(_day);}
  List<TitanScheduleJob> _seed(DateTime d)=>[
    TitanScheduleJob(id:'job-101',title:'House cleaning',customer:'Smith Residence',address:'Fitzroy, VIC',worker:'John',status:'scheduled',start:DateTime(d.year,d.month,d.day,9)),
    TitanScheduleJob(id:'job-102',title:'Pressure wash',customer:'Northside Property',address:'Northcote, VIC',worker:'Mia',status:'scheduled',start:DateTime(d.year,d.month,d.day,12,30),duration:const Duration(hours:2)),
    TitanScheduleJob(id:'job-103',title:'Maintenance',customer:'Thornbury Client',address:'Thornbury, VIC',worker:'Unassigned',status:'needs dispatch',start:DateTime(d.year,d.month,d.day,15),duration:const Duration(hours:1)),
  ];
  String _time(DateTime d)=>TimeOfDay.fromDateTime(d).format(context);
  Future<void> _assign(TitanScheduleJob job) async {
    final worker=await showModalBottomSheet<String>(context:context,builder:(c)=>SafeArea(child:Column(mainAxisSize:MainAxisSize.min,children:[const ListTile(title:Text('Assign worker')),for(final w in ['John','Mia','Alex']) ListTile(leading:const Icon(Icons.person_outline),title:Text(w),onTap:()=>Navigator.pop(c,w))])));
    if(worker==null)return;
    await widget.gateway.command('dispatch.assign',{'job_id':job.id,'worker':worker});
    if(!mounted)return; setState(()=>_jobs=_jobs.map((j)=>j.id==job.id?TitanScheduleJob(id:j.id,title:j.title,customer:j.customer,address:j.address,worker:worker,status:'scheduled',start:j.start,duration:j.duration):j).toList());
  }
  Future<void> _reschedule(TitanScheduleJob job) async {
    final picked=await showTimePicker(context:context,initialTime:TimeOfDay.fromDateTime(job.start)); if(picked==null)return;
    final next=DateTime(job.start.year,job.start.month,job.start.day,picked.hour,picked.minute);
    await widget.gateway.command('schedule.reschedule',{'job_id':job.id,'start_at':next.toIso8601String()});
    if(!mounted)return;setState(()=>_jobs=_jobs.map((j)=>j.id==job.id?TitanScheduleJob(id:j.id,title:j.title,customer:j.customer,address:j.address,worker:j.worker,status:j.status,start:next,duration:j.duration):j).toList()..sort((a,b)=>a.start.compareTo(b.start)));
  }
  @override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('Schedule & Dispatch'),actions:[IconButton(icon:const Icon(Icons.today),onPressed:(){setState((){_day=DateTime.now();_jobs=_seed(_day);});})]),body:Column(children:[
    SizedBox(height:64,child:ListView.builder(scrollDirection:Axis.horizontal,itemCount:7,itemBuilder:(c,i){final d=DateTime.now().add(Duration(days:i));final selected=d.day==_day.day&&d.month==_day.month;return Padding(padding:const EdgeInsets.symmetric(horizontal:4,vertical:6),child:ChoiceChip(selected:selected,label:Text('${d.day}/${d.month}'),onSelected:(_)=>setState((){_day=d;_jobs=_seed(d);})));})),
    Expanded(child:ListView.builder(padding:const EdgeInsets.all(12),itemCount:_jobs.length,itemBuilder:(c,i){final j=_jobs[i];return Card(child:InkWell(onTap:()=>Navigator.push(context,MaterialPageRoute(builder:(_)=>TitanJobScreen(gateway:widget.gateway,job:TitanJobDetail(id:j.id,title:j.title,customer:j.customer,phone:'+61 400 000 000',address:j.address,worker:j.worker,status:j.status=='needs dispatch'?'scheduled':j.status,checklist:const ['Confirm scope with customer','Complete service checklist','Capture completion evidence'])))),child:Padding(padding:const EdgeInsets.all(12),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Row(children:[Text('${_time(j.start)} – ${_time(j.end)}',style:const TextStyle(fontWeight:FontWeight.bold)),const Spacer(),Chip(label:Text(j.status))]),Text(j.title,style:Theme.of(context).textTheme.titleMedium),Text(j.customer),Text(j.address),const SizedBox(height:8),Row(children:[const Icon(Icons.person_outline,size:18),const SizedBox(width:6),Text(j.worker),const Spacer(),TextButton(onPressed:()=>_assign(j),child:Text(j.worker=='Unassigned'?'Assign':'Reassign')),TextButton(onPressed:()=>_reschedule(j),child:const Text('Reschedule'))])]))));}))
  ]));
}
