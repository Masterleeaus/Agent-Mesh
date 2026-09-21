import { useState, useEffect, type FC } from 'react';
import { TicketQueuePage, TicketDetailPage, NewTicketPage, MyTicketsPage, EscalationsPage, SLADashboardPage, TemplatesPage, QueueSettingsPage } from '../pages';

function parseHash(): { route: string; params: Record<string, string> } {
  const hash = window.location.hash.replace('#', '') || '/';
  const segments = hash.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === '')) {
    return { route: '/', params: {} };
  }
  if (segments[0] === 'tickets' && segments[1] === 'new') {
    return { route: '/tickets/new', params: {} };
  }
  if (segments[0] === 'tickets' && segments[1]) {
    return { route: '/tickets/:id', params: { id: segments[1] } };
  }
  if (segments[0] === 'tickets') {
    return { route: '/tickets', params: {} };
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
    case '/tickets':
      return <TicketQueuePage />;
    case '/tickets/new':
      return <NewTicketPage />;
    case '/tickets/:id':
      return <TicketDetailPage ticketId={params.id} />;
    case '/my-tickets':
      return <MyTicketsPage />;
    case '/escalations':
      return <EscalationsPage />;
    case '/sla':
      return <SLADashboardPage />;
    case '/templates':
      return <TemplatesPage />;
    case '/settings':
      return <QueueSettingsPage />;
    default:
      return <TicketQueuePage />;
  }
};
