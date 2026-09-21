import { useState, useEffect, type FC } from 'react';
import {
  DashboardPage, TodayJobsPage, AssignedJobsPage, UpcomingJobsPage,
  JobDetailPage, CustomerDetailsPage, NavigationPage,
  JobChecklistPage, ServiceNotesPage, PhotoUploadPage, VideoUploadPage,
  SignatureCapturePage, PartsUsedPage, InventoryRequestPage,
  PauseJobPage, ResumeJobPage, EscalateJobPage, CompleteJobPage,
  CompletedJobsPage, JobHistoryPage,
  NotificationsPage, MessagesPage, TechnicianProfilePage, SettingsPage
} from '../pages';

function parseHash(): { route: string; params: Record<string, string> } {
  const hash = window.location.hash.replace('#', '') || '/';
  const segments = hash.split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] === '') {
    return { route: '/', params: {} };
  }

  if (segments[0] === 'jobs' && segments[1] && segments[2]) {
    const sub = segments[2];
    if (['checklist', 'notes', 'photos', 'videos', 'signature', 'parts', 'inventory', 'pause', 'resume', 'escalate', 'complete', 'navigation', 'customer'].includes(sub)) {
      return { route: `/jobs/:id/${sub}`, params: { id: segments[1] } };
    }
  }

  if (segments[0] === 'jobs' && segments[1]) {
    return { route: '/jobs/:id', params: { id: segments[1] } };
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
    case '/dashboard':
      return <DashboardPage />;
    case '/today':
      return <TodayJobsPage />;
    case '/assigned':
      return <AssignedJobsPage />;
    case '/upcoming':
      return <UpcomingJobsPage />;
    case '/completed':
      return <CompletedJobsPage />;
    case '/history':
      return <JobHistoryPage />;
    case '/jobs/:id':
      return <JobDetailPage jobId={params.id} />;
    case '/jobs/:id/checklist':
      return <JobChecklistPage jobId={params.id} />;
    case '/jobs/:id/notes':
      return <ServiceNotesPage jobId={params.id} />;
    case '/jobs/:id/photos':
      return <PhotoUploadPage jobId={params.id} />;
    case '/jobs/:id/videos':
      return <VideoUploadPage jobId={params.id} />;
    case '/jobs/:id/signature':
      return <SignatureCapturePage jobId={params.id} />;
    case '/jobs/:id/parts':
      return <PartsUsedPage jobId={params.id} />;
    case '/jobs/:id/inventory':
      return <InventoryRequestPage jobId={params.id} />;
    case '/jobs/:id/pause':
      return <PauseJobPage jobId={params.id} />;
    case '/jobs/:id/resume':
      return <ResumeJobPage jobId={params.id} />;
    case '/jobs/:id/escalate':
      return <EscalateJobPage jobId={params.id} />;
    case '/jobs/:id/complete':
      return <CompleteJobPage jobId={params.id} />;
    case '/jobs/:id/navigation':
      return <NavigationPage jobId={params.id} />;
    case '/jobs/:id/customer':
      return <CustomerDetailsPage jobId={params.id} />;
    case '/messages':
      return <MessagesPage />;
    case '/notifications':
      return <NotificationsPage />;
    case '/profile':
      return <TechnicianProfilePage />;
    case '/settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
};
