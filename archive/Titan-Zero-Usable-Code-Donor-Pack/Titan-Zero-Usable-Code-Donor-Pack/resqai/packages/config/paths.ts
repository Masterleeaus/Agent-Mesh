export const PATHS = {
  apps: {
    appointmentBoard: 'apps/appointment-board',
    crmTracker: 'apps/crm-tracker',
    opsDashboard: 'apps/ops-dashboard',
    resolutionCenter: 'apps/resolution-center',
    supportQueue: 'apps/support-queue',
  },
  agents: {
    accountHealthMonitor: 'agents/account-health-monitor',
    operationsCoordinator: 'agents/operations-coordinator',
    requestClassifier: 'agents/request-classifier',
    resolutionAdvisor: 'agents/resolution-advisor',
    supportReplyDrafter: 'agents/support-reply-drafter',
  },
  functions: {
    accountHealthScan: 'functions/account-health-scan',
    flagSlippingFollowups: 'functions/flag-slipping-followups',
  },
  database: 'database',
  docs: 'docs',
  scripts: 'scripts',
  shared: 'shared',
  workflows: 'workflows',
  infrastructure: 'infrastructure',
} as const;
