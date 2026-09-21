import { useState, useEffect } from 'react';
import { CustomerDashboardPage } from '../pages/CustomerDashboardPage';
import { MyTicketsPage } from '../pages/MyTicketsPage';
import { CreateSupportRequestPage } from '../pages/CreateSupportRequestPage';
import { TicketDetailPage } from '../pages/TicketDetailPage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { AppointmentDetailPage } from '../pages/AppointmentDetailPage';
import { BookAppointmentPage } from '../pages/BookAppointmentPage';
import { AppointmentCalendarPage } from '../pages/AppointmentCalendarPage';
import { TrackTechnicianPage } from '../pages/TrackTechnicianPage';
import { LiveStatusPage } from '../pages/LiveStatusPage';
import { MessagesPage } from '../pages/MessagesPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ServiceHistoryPage } from '../pages/ServiceHistoryPage';
import { InvoicesPage } from '../pages/InvoicesPage';
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage';
import { PaymentsPage } from '../pages/PaymentsPage';
import { FeedbackPage } from '../pages/FeedbackPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { KnowledgeBaseArticlePage } from '../pages/KnowledgeBaseArticlePage';
import { DownloadsPage } from '../pages/DownloadsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import { SecurityPage } from '../pages/SecurityPage';
import { HelpCenterPage } from '../pages/HelpCenterPage';
import { DisputesPage } from '../pages/DisputesPage';
import { DisputeDetailPage } from '../pages/DisputeDetailPage';
import { AccountHealthPage } from '../pages/AccountHealthPage';

function parseHash(): string {
  return window.location.hash.replace(/^#/, '') || '/';
}

function matchRoute(hash: string): { route: string; params: Record<string, string> } {
  const path = hash.split('?')[0].replace(/\/$/, '');
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return { route: '/', params: {} };

  if (parts[0] === 'tickets' && parts[1] === 'new') return { route: '/tickets/new', params: {} };
  if (parts[0] === 'tickets' && parts[1]) return { route: '/tickets/:id', params: { id: parts[1] } };
  if (parts[0] === 'tickets') return { route: '/tickets', params: {} };

  if (parts[0] === 'appointments' && parts[1] === 'book') return { route: '/appointments/book', params: {} };
  if (parts[0] === 'appointments' && parts[1] === 'calendar') return { route: '/appointments/calendar', params: {} };
  if (parts[0] === 'appointments' && parts[1]) return { route: '/appointments/:id', params: { id: parts[1] } };
  if (parts[0] === 'appointments') return { route: '/appointments', params: {} };

  if (parts[0] === 'disputes' && parts[1]) return { route: '/disputes/:id', params: { id: parts[1] } };
  if (parts[0] === 'disputes') return { route: '/disputes', params: {} };

  if (parts[0] === 'knowledge-base' && parts[1]) return { route: '/knowledge-base/:id', params: { id: parts[1] } };
  if (parts[0] === 'knowledge-base') return { route: '/knowledge-base', params: {} };

  if (parts[0] === 'invoices' && parts[1]) return { route: '/invoices/:id', params: { id: parts[1] } };
  if (parts[0] === 'invoices') return { route: '/invoices', params: {} };

  if (parts[0] === 'track-technician') return { route: '/track-technician', params: {} };
  if (parts[0] === 'live-status') return { route: '/live-status', params: {} };
  if (parts[0] === 'messages') return { route: '/messages', params: {} };
  if (parts[0] === 'notifications') return { route: '/notifications', params: {} };
  if (parts[0] === 'service-history') return { route: '/service-history', params: {} };
  if (parts[0] === 'payments') return { route: '/payments', params: {} };
  if (parts[0] === 'feedback') return { route: '/feedback', params: {} };
  if (parts[0] === 'downloads') return { route: '/downloads', params: {} };
  if (parts[0] === 'profile') return { route: '/profile', params: {} };
  if (parts[0] === 'settings') return { route: '/settings', params: {} };
  if (parts[0] === 'security') return { route: '/security', params: {} };
  if (parts[0] === 'help') return { route: '/help', params: {} };

  if (parts[0] === 'account' && parts[1] === 'health') return { route: '/account/health', params: {} };
  if (parts[0] === 'account') return { route: '/account', params: {} };

  return { route: '/', params: {} };
}

export function Routes() {
  const [hash, setHash] = useState(parseHash);

  useEffect(() => {
    const onHashChange = () => setHash(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { route, params } = matchRoute(hash);

  switch (route) {
    case '/': return <CustomerDashboardPage />;
    case '/tickets': return <MyTicketsPage />;
    case '/tickets/new': return <CreateSupportRequestPage />;
    case '/tickets/:id': return <TicketDetailPage ticketId={params.id} />;
    case '/appointments': return <AppointmentsPage />;
    case '/appointments/:id': return <AppointmentDetailPage appointmentId={params.id} />;
    case '/appointments/book': return <BookAppointmentPage />;
    case '/appointments/calendar': return <AppointmentCalendarPage />;
    case '/track-technician': return <TrackTechnicianPage />;
    case '/live-status': return <LiveStatusPage />;
    case '/messages': return <MessagesPage />;
    case '/notifications': return <NotificationsPage />;
    case '/service-history': return <ServiceHistoryPage />;
    case '/invoices': return <InvoicesPage />;
    case '/invoices/:id': return <InvoiceDetailPage invoiceId={params.id} />;
    case '/payments': return <PaymentsPage />;
    case '/feedback': return <FeedbackPage />;
    case '/knowledge-base': return <KnowledgeBasePage />;
    case '/knowledge-base/:id': return <KnowledgeBaseArticlePage articleId={params.id} />;
    case '/downloads': return <DownloadsPage />;
    case '/profile': return <ProfilePage />;
    case '/settings': return <SettingsPage />;
    case '/security': return <SecurityPage />;
    case '/help': return <HelpCenterPage />;
    case '/disputes': return <DisputesPage />;
    case '/disputes/:id': return <DisputeDetailPage disputeId={params.id} />;
    case '/account': return <ProfilePage />;
    case '/account/health': return <AccountHealthPage />;
    default: return <CustomerDashboardPage />;
  }
}