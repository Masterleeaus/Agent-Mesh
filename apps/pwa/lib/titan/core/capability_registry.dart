enum TitanPresentation { generative, fullPage, device }

class TitanCapability {
  final String id; final TitanPresentation presentation; final bool offlineQueueable; final bool onlineRequired;
  const TitanCapability(this.id, this.presentation, {this.offlineQueueable=false, this.onlineRequired=false});
}

const titanCapabilities = <TitanCapability>[
  TitanCapability('customer.view', TitanPresentation.fullPage),
  TitanCapability('customer.call', TitanPresentation.device),
  TitanCapability('customer.message', TitanPresentation.device),
  TitanCapability('customer.email', TitanPresentation.device),
  TitanCapability('customer.address.use', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('jobs.view', TitanPresentation.generative),
  TitanCapability('job.detail', TitanPresentation.fullPage),
  TitanCapability('job.status.transition', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('job.notes.update', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('job.checklist.update', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('jobs.map', TitanPresentation.fullPage),
  TitanCapability('jobs.navigate', TitanPresentation.device, onlineRequired: true),
  TitanCapability('evidence.photo', TitanPresentation.device, offlineQueueable: true),
  TitanCapability('evidence.document', TitanPresentation.device, offlineQueueable: true),
  TitanCapability('evidence.signature', TitanPresentation.device, offlineQueueable: true),
  TitanCapability('quote.view', TitanPresentation.generative),
  TitanCapability('quote.send', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('quote.approve', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('job.complete', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('invoice.create', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('payment.record', TitanPresentation.generative, offlineQueueable: true),
  TitanCapability('commercial.lifecycle', TitanPresentation.fullPage),
  TitanCapability('invoice.view', TitanPresentation.generative),
  TitanCapability('schedule.view', TitanPresentation.fullPage),
  TitanCapability('schedule.reschedule', TitanPresentation.fullPage, offlineQueueable: true),
  TitanCapability('dispatch.assign', TitanPresentation.fullPage, offlineQueueable: true),
];
