import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/map_job.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

class TitanMapScreen extends StatefulWidget {
  final List<TitanMapJob> jobs;
  const TitanMapScreen({super.key, required this.jobs});

  @override State<TitanMapScreen> createState() => _TitanMapScreenState();
}

class _TitanMapScreenState extends State<TitanMapScreen> {
  GoogleMapController? _controller;
  MapType _mapType = MapType.normal;
  TitanMapJob? _selected;
  Position? _position;
  bool _locating = false;

  static const _fallback = LatLng(-37.8136, 144.9631);

  @override Widget build(BuildContext context) {
    final center = widget.jobs.isEmpty ? _fallback : LatLng(widget.jobs.first.latitude, widget.jobs.first.longitude);
    final markers = widget.jobs.map((job) => Marker(
      markerId: MarkerId(job.id), position: LatLng(job.latitude, job.longitude),
      infoWindow: InfoWindow(title: job.customer, snippet: '${job.time} · ${job.title}'),
      onTap: () => setState(() => _selected = job),
    )).toSet();

    return Scaffold(
      appBar: AppBar(title: const Text('Jobs map'), actions: [
        PopupMenuButton<MapType>(initialValue: _mapType, onSelected: (v) => setState(() => _mapType = v), itemBuilder: (_) => const [
          PopupMenuItem(value: MapType.normal, child: Text('Normal')),
          PopupMenuItem(value: MapType.hybrid, child: Text('Hybrid')),
          PopupMenuItem(value: MapType.satellite, child: Text('Satellite')),
          PopupMenuItem(value: MapType.terrain, child: Text('Terrain')),
        ])
      ]),
      body: Stack(children: [
        GoogleMap(
          initialCameraPosition: CameraPosition(target: center, zoom: 11.5),
          mapType: _mapType, markers: markers, myLocationEnabled: _position != null, myLocationButtonEnabled: _position != null,
          compassEnabled: true, trafficEnabled: true,
          onMapCreated: (c) { _controller = c; _fitJobs(); },
        ),
        if (_selected != null) Positioned(left: 12, right: 12, bottom: 16, child: _JobMapCard(job: _selected!, onClose: () => setState(() => _selected = null), onNavigate: () => _navigate(_selected!))),
      ]),
      floatingActionButton: Column(mainAxisSize: MainAxisSize.min, children:[FloatingActionButton.small(heroTag:'location',onPressed:_locating?null:_locate,child:Icon(_locating?Icons.hourglass_top:Icons.my_location)),const SizedBox(height:8),FloatingActionButton.small(heroTag:'fit',onPressed:_fitJobs,child:const Icon(Icons.center_focus_strong))]),
    );
  }


  Future<void> _locate() async {
    setState(()=>_locating=true);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) throw Exception('Location services are disabled');
      var permission=await Geolocator.checkPermission();
      if(permission==LocationPermission.denied) permission=await Geolocator.requestPermission();
      if(permission==LocationPermission.denied || permission==LocationPermission.deniedForever) throw Exception('Location permission is required');
      final p=await Geolocator.getCurrentPosition();
      if(!mounted)return; setState(()=>_position=p);
      await _controller?.animateCamera(CameraUpdate.newLatLngZoom(LatLng(p.latitude,p.longitude),14));
    } catch(e) { if(mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(e.toString().replaceFirst('Exception: ','')))); }
    finally { if(mounted)setState(()=>_locating=false); }
  }
  Future<void> _navigate(TitanMapJob job) async {
    final uri=Uri.parse('https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}&travelmode=driving');
    if(!await launchUrl(uri,mode:LaunchMode.externalApplication) && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('Could not open navigation')));
  }

  Future<void> _fitJobs() async {
    if (_controller == null || widget.jobs.isEmpty) return;
    if (widget.jobs.length == 1) {
      await _controller!.animateCamera(CameraUpdate.newLatLngZoom(LatLng(widget.jobs.first.latitude, widget.jobs.first.longitude), 14)); return;
    }
    var minLat = widget.jobs.first.latitude, maxLat = minLat, minLng = widget.jobs.first.longitude, maxLng = minLng;
    for (final j in widget.jobs.skip(1)) { if (j.latitude < minLat) minLat=j.latitude; if (j.latitude>maxLat) maxLat=j.latitude; if(j.longitude<minLng)minLng=j.longitude; if(j.longitude>maxLng)maxLng=j.longitude; }
    await _controller!.animateCamera(CameraUpdate.newLatLngBounds(LatLngBounds(southwest: LatLng(minLat,minLng), northeast: LatLng(maxLat,maxLng)), 70));
  }
}

class _JobMapCard extends StatelessWidget {
  final TitanMapJob job; final VoidCallback onClose; final VoidCallback onNavigate;
  const _JobMapCard({required this.job, required this.onClose, required this.onNavigate});
  @override Widget build(BuildContext context) => Card(elevation: 6, child: Padding(padding: const EdgeInsets.all(14), child: Row(children: [
    const Icon(Icons.home_repair_service_outlined), const SizedBox(width: 12),
    Expanded(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(job.customer, style: const TextStyle(fontWeight: FontWeight.w700)), Text('${job.time} · ${job.title}'), Text(job.address, maxLines: 2, overflow: TextOverflow.ellipsis),
      TextButton.icon(onPressed:onNavigate,icon:const Icon(Icons.navigation_outlined,size:18),label:const Text('Navigate'))
    ])), IconButton(onPressed: onClose, icon: const Icon(Icons.close))
  ])));
}
