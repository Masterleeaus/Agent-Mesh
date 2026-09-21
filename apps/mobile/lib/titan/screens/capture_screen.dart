import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cunning_document_scanner/cunning_document_scanner.dart';
import 'package:signature/signature.dart';
import 'package:path_provider/path_provider.dart';
import '../models/evidence_item.dart';
import '../services/evidence_sync_service.dart';
import '../services/titan_gateway.dart';

class TitanCaptureScreen extends StatefulWidget {
  final String jobId;
  final TitanGateway gateway;
  const TitanCaptureScreen({super.key, required this.jobId, required this.gateway});
  @override State<TitanCaptureScreen> createState() => _TitanCaptureScreenState();
}
class _TitanCaptureScreenState extends State<TitanCaptureScreen> {
  final _picker = ImagePicker();
  final _signature = SignatureController(penStrokeWidth: 3);
  final List<TitanEvidenceItem> _evidence = [];
  late final EvidenceSyncService _sync = EvidenceSyncService(widget.gateway);
  @override void dispose(){_signature.dispose();super.dispose();}
  String _id() => '${widget.jobId}-${DateTime.now().microsecondsSinceEpoch}';
  Future<void> _queue(String path, TitanEvidenceKind kind) async {
    final item = TitanEvidenceItem(id:_id(),jobId:widget.jobId,kind:kind,localPath:path,createdAt:DateTime.now());
    final queued = await _sync.queue(item); if(mounted)setState(()=>_evidence.add(queued));
  }
  Future<void> _photo() async { final x=await _picker.pickImage(source: ImageSource.camera, imageQuality: 85); if(x!=null)await _queue(x.path,TitanEvidenceKind.photo); }
  Future<void> _scan() async { final xs=await CunningDocumentScanner.getPictures(noOfPages: 10) ?? []; for(final p in xs){await _queue(p,TitanEvidenceKind.document);} }
  Future<void> _useSignature() async { final bytes=await _signature.toPngBytes(); if(bytes==null||bytes.isEmpty)return; final dir=await getTemporaryDirectory(); final file=File('${dir.path}/${_id()}-signature.png'); await file.writeAsBytes(bytes,flush:true); await _queue(file.path,TitanEvidenceKind.signature); _signature.clear(); }
  Future<void> _retry(int index) async { final next=await _sync.retry(_evidence[index]); if(mounted)setState(()=>_evidence[index]=next); }
  @override Widget build(BuildContext context)=>Scaffold(
    appBar: AppBar(title: Text('Evidence · ${widget.jobId}')),
    body: ListView(padding: const EdgeInsets.all(16),children:[
      Text('Capture for job ${widget.jobId}',style:Theme.of(context).textTheme.titleLarge),const SizedBox(height:8),
      Row(children:[Expanded(child:FilledButton.icon(onPressed:_photo,icon:const Icon(Icons.camera_alt_outlined),label:const Text('Take photo'))),const SizedBox(width:8),Expanded(child:OutlinedButton.icon(onPressed:_scan,icon:const Icon(Icons.document_scanner_outlined),label:const Text('Scan document')))]),
      const SizedBox(height:20),Text('Signature',style:Theme.of(context).textTheme.titleMedium),const SizedBox(height:8),
      Container(height:180,decoration:BoxDecoration(border:Border.all(color:Theme.of(context).dividerColor),borderRadius:BorderRadius.circular(12)),child:Signature(controller:_signature,backgroundColor:Theme.of(context).colorScheme.surface)),
      Row(mainAxisAlignment:MainAxisAlignment.end,children:[TextButton(onPressed:_signature.clear,child:const Text('Clear')),FilledButton(onPressed:_useSignature,child:const Text('Use signature'))]),
      const SizedBox(height:16),Text('Evidence queue (${_evidence.length})',style:Theme.of(context).textTheme.titleMedium),
      ..._evidence.asMap().entries.map((row){final e=row.value;return ListTile(contentPadding:EdgeInsets.zero,leading:Icon(_icon(e.syncState)),title:Text('${e.kind.name} · ${e.localPath.split('/').last}'),subtitle:Text('${e.syncState.name}${e.attempts>0?' · attempts ${e.attempts}':''}${e.error!=null?' · ${e.error}':''}'),trailing:e.syncState==TitanSyncState.failed?IconButton(onPressed:()=>_retry(row.key),icon:const Icon(Icons.refresh)):null);}),
    ]));
  IconData _icon(TitanSyncState s)=>switch(s){TitanSyncState.queued=>Icons.cloud_upload_outlined,TitanSyncState.syncing=>Icons.sync,TitanSyncState.synced=>Icons.cloud_done_outlined,TitanSyncState.failed=>Icons.error_outline};
}
