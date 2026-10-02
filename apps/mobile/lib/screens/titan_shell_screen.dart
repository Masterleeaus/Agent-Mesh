import 'package:flutter/material.dart';
import '../titan/services/titan_gateway.dart';
import '../titan/models/generative_item.dart';
import '../titan/widgets/generative_cards.dart';

class TitanShellScreen extends StatefulWidget {
  final TitanGateway gateway;
  const TitanShellScreen({super.key, required this.gateway});
  @override State<TitanShellScreen> createState() => _TitanShellScreenState();
}

class _TitanShellScreenState extends State<TitanShellScreen> {
  final _composer = TextEditingController();
  final List<_Turn> _turns = [];
  String? _sendError;
  bool _sending = false;
  TitanGateway get _gateway => widget.gateway;
  @override void dispose() { _composer.dispose(); super.dispose(); }

  Future<void> _send() async {
    final text = _composer.text.trim(); if (text.isEmpty) return;
    if (_sending) return;
    setState(() { _sending = true; _sendError = null; });
    try {
      final items = await _gateway.converse(text);
      if (!mounted) return;
      setState(() {
        _turns.add(_Turn(text, items));
        if (_composer.text.trim() == text) _composer.clear();
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _sendError = 'Could not reach Titan. Your message is still here; check your connection or sign in again, then retry.');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _quickAsk(String text) {
    final lower = text.toLowerCase();
    if (lower.contains('photo') || lower.contains('scan') ||
        lower.contains('signature') || lower.contains('evidence')) {
      _showUnavailable('Evidence capture needs a server-scoped job before it can open.');
      return;
    }
    if (lower.contains('schedule') || lower.contains('dispatch') ||
        lower.contains('calendar') || lower.contains('reschedule')) {
      _showUnavailable('Schedule and dispatch are unavailable until the hosted projection is loaded.');
      return;
    }
    if (lower.contains('map') || lower.contains('where are') ||
        lower.contains('route') || lower.contains('navigate')) {
      _showUnavailable('The jobs map needs a hosted, audience-scoped job projection.');
      return;
    }
    _composer.text = text;
    _send();
  }

  void _handleGeneratedAction(String action, TitanGenerativeItem item) {
    final lower = action.toLowerCase();
    final jobId = item.context['job_id']?.toString();
    if (lower.contains('customer')) {
      _showUnavailable('Customer details require a hosted relationship-checked projection.');
      return;
    }
    if ((lower.contains('quote') || lower.contains('invoice') ||
        lower.contains('payment') || lower.contains('paid')) &&
        (jobId == null || jobId.isEmpty)) {
      _showUnavailable('Commercial actions require a hosted, audience-scoped job reference.');
      return;
    }
    if (lower.contains('evidence')) {
      _showUnavailable('Evidence capture needs a hosted, audience-scoped job projection.');
      return;
    }
    if (lower.contains('schedule') || lower.contains('reschedule') ||
        lower.contains('dispatch')) {
      _showUnavailable('Schedule and dispatch are unavailable until the hosted projection is loaded.');
      return;
    }
    if (lower.contains('map') || lower.contains('navigate')) {
      _showUnavailable('The jobs map needs a hosted, audience-scoped job projection.');
      return;
    }
    _quickAsk(action + ' ' + item.title);
  }

  void _showUnavailable(String message) {
    setState(() => _sendError = message);
  }

  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Titan Zero'), actions: [IconButton(onPressed: () => _showUnavailable('Notifications require a hosted attention projection.'), icon: const Icon(Icons.notifications_none)), IconButton(onPressed: () => _showUnavailable('Profile and company context require authenticated hosted session state.'), icon: const Icon(Icons.person_outline))]),
    body: SafeArea(child: Column(children: [
      if (MediaQuery.viewInsetsOf(context).bottom == 0)
        _ContextCards(onTap: _quickAsk),
      const Divider(height: 1),
      Expanded(child: _turns.isEmpty ? const _EmptySurface() : ListView.builder(
        padding: const EdgeInsets.all(12), itemCount: _turns.length,
        itemBuilder: (context, i) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Align(alignment: Alignment.centerRight, child: Container(margin: const EdgeInsets.only(bottom: 10, left: 50), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10), decoration: BoxDecoration(color: Theme.of(context).colorScheme.primaryContainer, borderRadius: BorderRadius.circular(16)), child: Text(_turns[i].text))),
          ..._turns[i].items.map((item) => TitanGenerativeCard(item: item, onAction: (action) => _handleGeneratedAction(action, item))),
        ]),
      )),
      if (_sendError != null) Padding(
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
        child: Text(_sendError!, key: const Key('conversation-send-error'),
            style: TextStyle(color: Theme.of(context).colorScheme.error)),
      ),
      _Composer(controller: _composer, onSend: _send, onUnavailable: () => _showUnavailable('Attachments and voice input require a hosted capability and permission state.'), sending: _sending),
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
class _ContextCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final VoidCallback onTap;

  const _ContextCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 160,
        child: Card(
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Row(
                children: [
                  Icon(icon, size: 20),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          value,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}

class _EmptySurface extends StatelessWidget { const _EmptySurface(); @override Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children:[Icon(Icons.auto_awesome,size:42,color:Theme.of(context).colorScheme.primary),const SizedBox(height:14),Text('What do you need?',style:Theme.of(context).textTheme.headlineSmall),const SizedBox(height:8),const Text('Ask naturally. Titan returns the job, customer, schedule, invoice or action you need — not another screen.',textAlign:TextAlign.center)]))); }
class _Composer extends StatelessWidget { final TextEditingController controller; final VoidCallback onSend; final VoidCallback onUnavailable; final bool sending; const _Composer({required this.controller,required this.onSend,required this.onUnavailable,this.sending=false}); @override Widget build(BuildContext context)=>Padding(padding:const EdgeInsets.fromLTRB(12,8,12,12),child:Row(children:[IconButton(onPressed:onUnavailable,icon:const Icon(Icons.add_circle_outline)),Expanded(child:TextField(controller:controller,minLines:1,maxLines:5,textInputAction:TextInputAction.send,onSubmitted:(_)=>onSend(),decoration:const InputDecoration(hintText:'Ask Titan…',border:OutlineInputBorder()))),IconButton(onPressed:onUnavailable,icon:const Icon(Icons.mic_none)),IconButton(onPressed:sending?null:onSend,icon:sending?const SizedBox(width:20,height:20,child:CircularProgressIndicator(strokeWidth:2)):const Icon(Icons.arrow_upward))])); }
