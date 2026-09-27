(() => {
  const root = window.TitanWorkCore = window.TitanWorkCore || {};
  root.contracts = Object.freeze({
    version: '2.2.0',
    database: { name: 'titan-workcore-device', version: 7 },
    stores: Object.freeze({
      meta: 'meta', records: 'records', jobPacks: 'job_packs', drafts: 'drafts',
      outbox: 'outbox', conflicts: 'conflicts', attachments: 'attachments', uploadSessions: 'upload_sessions', tombstones: 'tombstones', attachmentChunks: 'attachment_chunks', knowledgeArticles: 'knowledge_articles', knowledgeMedia: 'knowledge_media', offlinePacks: 'offline_packs', syncLog: 'sync_log'
    }),
    states: Object.freeze(['draft','queued','sending','sent','failed','needs-review','conflict','cancelled']),
    resultStates: Object.freeze(['accepted','replayed','rejected','failed','needs-review','conflict']),
    commands: Object.freeze({
      MARK_ARRIVED: 'operations.work-order.mark-arrived',
      START_JOB: 'operations.work-order.start',
      COMPLETE_JOB: 'operations.work-order.complete',
      CHANGE_JOB_STATUS: 'operations.work-order.change-status',
      COMPLETE_TASK: 'operations.work-order.task.update-status',
      ADD_TIME_ENTRY: 'operations.work-order.time-entry.create',
      SUBMIT_FORM: 'forms.submission.create',
      REPORT_INCIDENT: 'compliance.incident.create',
      CONSUME_INVENTORY: 'inventory.stock.consume',
      ADD_EVIDENCE: 'trade-compliance.work-order.evidence.add',
      CLOCK_IN: 'attendance.clock-in',
      CLOCK_OUT: 'attendance.clock-out'
    }),
    endpoints: Object.freeze({
      actions: '/api/v1/workcore/actions',
      executeAction: action => `/api/v1/workcore/actions/${encodeURIComponent(action)}/execute`,
      operations: '/api/v1/sync/operations',
      operationsBatch: '/api/v1/sync/operations/batch',
      operation: id => `/api/v1/sync/operations/${encodeURIComponent(id)}`,
      jobPacks: '/api/v1/workcore/offline/job-packs',
      changes: '/api/v1/workcore/offline/changes',
      attachments: '/api/v1/workcore/offline/attachments',
      attachmentSessions: '/api/v1/workcore/offline/attachments',
      attachmentSession: id => `/api/v1/workcore/offline/attachments/${encodeURIComponent(id)}`, 
      knowledge: '/api/v1/workcore/offline/knowledge',
      knowledgeChanges: '/api/v1/workcore/offline/knowledge/changes',
      reachability: '/api/v1/workcore/actions',
      refreshSession: '/api/auth/refresh'
    }),
    requiredContext: Object.freeze(['company_id','user_id','device_id']),
    operationFields: Object.freeze(['operation_id','device_id','action','payload','occurred_at'])
  });
})();
