import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/customer_record.dart';
import '../services/titan_gateway.dart';

class TitanCustomerScreen extends StatelessWidget {
  final TitanGateway gateway; final TitanCustomerRecord customer;
  const TitanCustomerScreen({super.key,required this.gateway,required this.customer});
  Future<void> _launch(Uri uri) async {if(await canLaunchUrl(uri))await launchUrl(uri);}
  @override Widget build(BuildContext context)=>Scaffold(
    appBar:AppBar(title:Text(customer.name)),
    body:ListView(padding:const EdgeInsets.all(16),children:[
      Row(children:[CircleAvatar(radius:26,child:Text(customer.name.isEmpty?'?':customer.name[0])),const SizedBox(width:12),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(customer.name,style:Theme.of(context).textTheme.titleLarge),Text(customer.email)]))]),
      const SizedBox(height:12),
      Wrap(spacing:8,children:[
        OutlinedButton.icon(onPressed:()=>_launch(Uri(scheme:'tel',path:customer.phone)),icon:const Icon(Icons.call_outlined),label:const Text('Call')),
        OutlinedButton.icon(onPressed:()=>_launch(Uri(scheme:'sms',path:customer.phone)),icon:const Icon(Icons.message_outlined),label:const Text('Message')),
        OutlinedButton.icon(onPressed:()=>_launch(Uri(scheme:'mailto',path:customer.email)),icon:const Icon(Icons.email_outlined),label:const Text('Email')),
      ]),
      const Divider(height:32),Text('Addresses',style:Theme.of(context).textTheme.titleMedium),
      ...customer.addresses.map((a)=>Card(child:ListTile(leading:const Icon(Icons.location_on_outlined),title:Text(a.label),subtitle:Text(a.address),trailing:IconButton(icon:const Icon(Icons.copy_outlined),onPressed:()=>widgetCommand(context,'customer.address.use',{'customer_id':customer.id,'address':a.address})) ))),
      const SizedBox(height:18),Text('Contact history',style:Theme.of(context).textTheme.titleMedium),
      ...customer.history.map((h)=>ListTile(contentPadding:EdgeInsets.zero,leading:Icon(h.type=='call'?Icons.call_outlined:h.type=='message'?Icons.message_outlined:Icons.notes_outlined),title:Text(h.summary),subtitle:Text(h.when))),
    ]));
  Future<void> widgetCommand(BuildContext context,String capability,Map<String,dynamic> payload) async {
    await gateway.command(capability,payload);
    if(context.mounted)ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('Address selected')));
  }
}
