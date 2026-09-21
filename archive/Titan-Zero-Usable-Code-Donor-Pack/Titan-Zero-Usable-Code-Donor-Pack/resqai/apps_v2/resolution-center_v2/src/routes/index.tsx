import { useState, useEffect, type FC } from 'react';
import {
  ResolutionDashboardPage, PendingResolutionsPage, DisputeQueuePage, CaseDetailsPage,
  EvidenceReviewPage, TechnicianReportReviewPage, CustomerComplaintReviewPage,
  ApprovalQueuePage, EscalationReviewPage, ResolutionHistoryPage, ClosedCasesPage,
  KnowledgeBasePage, ReportsPage, SearchPage,
} from '../pages';

function parseHash(): { route: string; params: Record<string, string> } {
  const hash = window.location.hash.replace('#', '') || '/';
  const segments = hash.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === '')) {
    return { route: '/', params: {} };
  }

  if (segments[0] === 'pending') return { route: '/pending', params: {} };
  if (segments[0] === 'disputes' && segments[1]) return { route: '/disputes/:id', params: { id: segments[1] } };
  if (segments[0] === 'disputes') return { route: '/disputes', params: {} };
  if (segments[0] === 'cases' && segments[1] && segments[2] === 'evidence') return { route: '/cases/:id/evidence', params: { id: segments[1] } };
  if (segments[0] === 'cases' && segments[1] && segments[2] === 'technician-report') return { route: '/cases/:id/technician-report', params: { id: segments[1] } };
  if (segments[0] === 'cases' && segments[1] && segments[2] === 'complaint') return { route: '/cases/:id/complaint', params: { id: segments[1] } };
  if (segments[0] === 'approvals') return { route: '/approvals', params: {} };
  if (segments[0] === 'escalations') return { route: '/escalations', params: {} };
  if (segments[0] === 'history') return { route: '/history', params: {} };
  if (segments[0] === 'closed') return { route: '/closed', params: {} };
  if (segments[0] === 'knowledge-base') return { route: '/knowledge-base', params: {} };
  if (segments[0] === 'reports') return { route: '/reports', params: {} };
  if (segments[0] === 'search') return { route: '/search', params: {} };

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
    case '/dashboard':
      return <ResolutionDashboardPage />;
    case '/pending':
      return <PendingResolutionsPage />;
    case '/disputes':
      return <DisputeQueuePage />;
    case '/disputes/:id':
      return <CaseDetailsPage caseId={params.id} />;
    case '/cases/:id/evidence':
      return <EvidenceReviewPage caseId={params.id} />;
    case '/cases/:id/technician-report':
      return <TechnicianReportReviewPage caseId={params.id} />;
    case '/cases/:id/complaint':
      return <CustomerComplaintReviewPage caseId={params.id} />;
    case '/approvals':
      return <ApprovalQueuePage />;
    case '/escalations':
      return <EscalationReviewPage />;
    case '/history':
      return <ResolutionHistoryPage />;
    case '/closed':
      return <ClosedCasesPage />;
    case '/knowledge-base':
      return <KnowledgeBasePage />;
    case '/reports':
      return <ReportsPage />;
    case '/search':
      return <SearchPage />;
    default:
      return <ResolutionDashboardPage />;
  }
};
