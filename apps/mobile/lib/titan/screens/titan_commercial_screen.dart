import 'package:flutter/material.dart';
import '../services/titan_gateway.dart';

class TitanCommercialScreen extends StatefulWidget {
  final TitanGateway gateway;
  final String jobId;
  final String customer;
  const TitanCommercialScreen({super.key,required this.gateway,required this.jobId,required this.customer});
  @override State<TitanCommercialScreen> createState()=>_TitanCommercialScreenState();
}
class _TitanCommercialScreenState extends State<TitanCommercialScreen>{
  String stage='draft_quote';
  double amount=180;
  bool busy=false;
  Future<void> _run(String capability,String next,Map<String,dynamic> data) async{
    setState(()=>busy=true);
    try{await widget.gateway.command(capability,{'job_id':widget.jobId,'customer':widget.customer,'amount':amount,...data});if(mounted)setState(()=>stage=next);}
    finally{if(mounted)setState(()=>busy=false);}
  }
  Widget _step(String title,String subtitle,bool done)=>ListTile(
    leading:Icon(done?Icons.check_circle:Icons.radio_button_unchecked),
    title:Text(title),subtitle:Text(subtitle));
  int get index=>const ['draft_quote','quote_sent','approved','completed','invoiced','paid'].indexOf(stage);
  @override Widget build(BuildContext context)=>Scaffold(
    appBar:AppBar(title:const Text('Quote · Invoice · Payment')),
    body:ListView(padding:const EdgeInsets.all(16),children:[
      Text(widget.customer,style:Theme.of(context).textTheme.titleLarge),
      Text('Job ${widget.jobId}'),const SizedBox(height:16),
      Card(child:Padding(padding:const EdgeInsets.all(14),child:Column(children:[
        TextFormField(initialValue:amount.toStringAsFixed(2),keyboardType:TextInputType.number,
          decoration:const InputDecoration(labelText:'Amount',prefixText:r'$ '),
          onChanged:(v)=>amount=double.tryParse(v)??amount),
        const SizedBox(height:12),
        _step('Quote','Prepare and send customer quote',index>=1),
        _step('Approval','Customer approves work',index>=2),
        _step('Completion','Job work completed',index>=3),
        _step('Invoice','Issue invoice from completed work',index>=4),
        _step('Payment','Record payment',index>=5),
      ]))),
      const SizedBox(height:12),
      if(stage=='draft_quote') FilledButton.icon(onPressed:busy?null:()=>_run('quote.send','quote_sent',{}),icon:const Icon(Icons.send_outlined),label:const Text('Send quote')),
      if(stage=='quote_sent') FilledButton.icon(onPressed:busy?null:()=>_run('quote.approve','approved',{'approval_source':'customer'}),icon:const Icon(Icons.thumb_up_alt_outlined),label:const Text('Record approval')),
      if(stage=='approved') FilledButton.icon(onPressed:busy?null:()=>_run('job.complete','completed',{}),icon:const Icon(Icons.check_circle_outline),label:const Text('Complete job')),
      if(stage=='completed') FilledButton.icon(onPressed:busy?null:()=>_run('invoice.create','invoiced',{}),icon:const Icon(Icons.receipt_long_outlined),label:const Text('Create invoice')),
      if(stage=='invoiced') FilledButton.icon(onPressed:busy?null:()=>_run('payment.record','paid',{'method':'bank_transfer'}),icon:const Icon(Icons.payments_outlined),label:const Text('Record payment')),
      if(stage=='paid') const Card(child:ListTile(leading:Icon(Icons.verified_outlined),title:Text('Lifecycle complete'),subtitle:Text('Quote approved · job completed · invoice issued · payment recorded'))),
    ]));
}
