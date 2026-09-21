import { useMemo } from 'react';
import AccountDashboardPage from '../pages/AccountDashboardPage';
import AccountListPage from '../pages/AccountListPage';
import AccountDetailPage from '../pages/AccountDetailPage';
import FollowupCenterPage from '../pages/FollowupCenterPage';
import NewFollowupPage from '../pages/NewFollowupPage';
import FollowupDetailPage from '../pages/FollowupDetailPage';
import HealthScansPage from '../pages/HealthScansPage';
import RiskSignalsPage from '../pages/RiskSignalsPage';
import CustomerTimelinePage from '../pages/CustomerTimelinePage';
import InteractionHistoryPage from '../pages/InteractionHistoryPage';
import CustomerSatisfactionPage from '../pages/CustomerSatisfactionPage';
import CustomerFeedbackPage from '../pages/CustomerFeedbackPage';
import RenewalOpportunitiesPage from '../pages/RenewalOpportunitiesPage';
import UpsellOpportunitiesPage from '../pages/UpsellOpportunitiesPage';
import RetentionDashboardPage from '../pages/RetentionDashboardPage';
import CommunicationCenterPage from '../pages/CommunicationCenterPage';
import NotesPage from '../pages/NotesPage';
import TasksPage from '../pages/TasksPage';
import ReportsPage from '../pages/ReportsPage';
import SearchPage from '../pages/SearchPage';
import RecordFeedbackPage from '../pages/RecordFeedbackPage';
import CreateTaskPage from '../pages/CreateTaskPage';
import AddNotePage from '../pages/AddNotePage';
import ScheduleCallPage from '../pages/ScheduleCallPage';

export function Routes() {
  const hash = window.location.hash.slice(1) || '/';

  const route = useMemo(() => {
    const parts = hash.split('/').filter(Boolean);
    if (hash === '/') return { page: 'dashboard' as const };
    if (hash === '/accounts') return { page: 'accounts' as const };
    if (parts.length === 2 && parts[0] === 'accounts') return { page: 'account-detail' as const, id: parts[1] };
    if (hash === '/followups') return { page: 'followups' as const };
    if (hash === '/followups/new') return { page: 'new-followup' as const };
    if (parts.length === 2 && parts[0] === 'followups') return { page: 'followup-detail' as const, id: parts[1] };
    if (hash === '/scans') return { page: 'scans' as const };
    if (hash === '/risks') return { page: 'risks' as const };
    if (hash === '/timeline') return { page: 'timeline' as const };
    if (hash === '/interactions') return { page: 'interactions' as const };
    if (hash === '/satisfaction') return { page: 'satisfaction' as const };
    if (hash === '/feedback') return { page: 'feedback' as const };
    if (hash === '/feedback/new') return { page: 'record-feedback' as const };
    if (hash === '/renewals') return { page: 'renewals' as const };
    if (hash === '/upsells') return { page: 'upsells' as const };
    if (hash === '/retention') return { page: 'retention' as const };
    if (hash === '/communications') return { page: 'communications' as const };
    if (hash === '/notes') return { page: 'notes' as const };
    if (hash === '/notes/new') return { page: 'add-note' as const };
    if (hash === '/tasks') return { page: 'tasks' as const };
    if (hash === '/tasks/new') return { page: 'create-task' as const };
    if (hash === '/reports') return { page: 'reports' as const };
    if (hash === '/search') return { page: 'search' as const };
    if (hash === '/calls/new') return { page: 'schedule-call' as const };
    return { page: 'dashboard' as const };
  }, [hash]);

  switch (route.page) {
    case 'dashboard': return <AccountDashboardPage />;
    case 'accounts': return <AccountListPage />;
    case 'account-detail': return <AccountDetailPage id={route.id!} />;
    case 'followups': return <FollowupCenterPage />;
    case 'new-followup': return <NewFollowupPage />;
    case 'followup-detail': return <FollowupDetailPage id={route.id!} />;
    case 'scans': return <HealthScansPage />;
    case 'risks': return <RiskSignalsPage />;
    case 'timeline': return <CustomerTimelinePage />;
    case 'interactions': return <InteractionHistoryPage />;
    case 'satisfaction': return <CustomerSatisfactionPage />;
    case 'feedback': return <CustomerFeedbackPage />;
    case 'record-feedback': return <RecordFeedbackPage />;
    case 'renewals': return <RenewalOpportunitiesPage />;
    case 'upsells': return <UpsellOpportunitiesPage />;
    case 'retention': return <RetentionDashboardPage />;
    case 'communications': return <CommunicationCenterPage />;
    case 'notes': return <NotesPage />;
    case 'add-note': return <AddNotePage />;
    case 'tasks': return <TasksPage />;
    case 'create-task': return <CreateTaskPage />;
    case 'reports': return <ReportsPage />;
    case 'search': return <SearchPage />;
    case 'schedule-call': return <ScheduleCallPage />;
    default: return <AccountDashboardPage />;
  }
}
