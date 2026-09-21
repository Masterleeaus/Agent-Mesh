import { useState, useEffect, type FC } from 'react';
import {
  OperationsDashboardPage,
  DispatchQueuePage,
  LiveOperationsBoardPage,
  AssignmentBoardPage,
  TechnicianMonitoringPage,
  PendingAssignmentsPage,
  EscalationQueuePage,
  OperationsTimelinePage,
  DailyOperationsPage,
  RegionalOperationsPage,
  CompletedOperationsPage,
  OperationsReportsPage,
  SearchPage,
} from '../pages';

function parseHash(): { route: string; params: Record<string, string> } {
  const hash = window.location.hash.replace('#', '') || '/';
  const segments = hash.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === '')) {
    return { route: '/', params: {} };
  }
  if (segments[0] === 'operations' && segments[1]) {
    return { route: '/operations/:id', params: { id: segments[1] } };
  }
  return { route: `/${segments[0]}`, params: {} };
}

export const Routes: FC = () => {
  const [routeInfo, setRouteInfo] = useState(parseHash);

  useEffect(() => {
    const handler = () => setRouteInfo(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const { route, params } = routeInfo;

  switch (route) {
    case '/':
      return <OperationsDashboardPage />;
    case '/dispatch-queue':
      return <DispatchQueuePage />;
    case '/live-board':
      return <LiveOperationsBoardPage />;
    case '/assignments':
      return <AssignmentBoardPage />;
    case '/technicians':
      return <TechnicianMonitoringPage />;
    case '/pending-assignments':
      return <PendingAssignmentsPage />;
    case '/escalations':
      return <EscalationQueuePage />;
    case '/timeline':
      return <OperationsTimelinePage />;
    case '/daily':
      return <DailyOperationsPage />;
    case '/regional':
      return <RegionalOperationsPage />;
    case '/completed':
      return <CompletedOperationsPage />;
    case '/reports':
      return <OperationsReportsPage />;
    case '/search':
      return <SearchPage />;
    case '/operations/:id':
      return <div style={{ padding: 24, color: '#e6ecf5' }}>Operation Detail: {params.id} (coming soon)</div>;
    default:
      return <OperationsDashboardPage />;
  }
};
