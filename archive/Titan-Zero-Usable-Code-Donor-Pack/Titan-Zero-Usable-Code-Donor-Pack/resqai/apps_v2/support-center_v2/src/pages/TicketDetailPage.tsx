import { useState, type FC } from 'react';
import { DetailLayout, Tabs, Card, Button, StatusBadge, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { TicketDetailPanel, MessageThread, ReplyEditor, AIReplySuggestion, TicketHistoryTimeline, OwnerAssigner, TemplateSelector, SLAStopwatch } from '../components';
import { useTicketDetail } from '../hooks/useTicketDetail';
import { useTemplates } from '../hooks/useTemplates';
import { ticketService } from '../services/ticket-service';
import { useAppContext } from '../state/AppContext';
import { SUPPORT_CENTER_PERMISSIONS } from '../contracts/permissions';
import { PermissionGuard } from '../components/PermissionGuard';
import type { Tab } from '@resqai/foundation';
import type { TemplateDTO } from '../models/dto';

interface TicketDetailPageProps {
  ticketId: string;
}

const detailTabs: Tab[] = [
  { id: 'thread', label: 'Thread' },
  { id: 'activity', label: 'Activity' },
  { id: 'customer', label: 'Customer Info' },
  { id: 'related', label: 'Related Records' },
];

const agentOptions = [
  { value: 'agent-001', label: 'Sarah Connor' },
  { value: 'agent-002', label: 'Mike Peters' },
  { value: 'agent-003', label: 'Lisa Wong' },
  { value: 'agent-004', label: 'Tom Rivera' },
  { value: 'agent-005', label: 'Jane Foster' },
];

export const TicketDetailPage: FC<TicketDetailPageProps> = ({ ticketId }) => {
  const { detail, loading, error, refetch } = useTicketDetail(ticketId);
  const { templates } = useTemplates();
  const { currentUserPermissions } = useAppContext();
  const [activeTab, setActiveTab] = useState('thread');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const canDraft = currentUserPermissions.includes(SUPPORT_CENTER_PERMISSIONS.DRAFT_REPLY);
  const canApprove = currentUserPermissions.includes(SUPPORT_CENTER_PERMISSIONS.APPROVE_REPLY);
  const canEscalate = currentUserPermissions.includes(SUPPORT_CENTER_PERMISSIONS.ESCALATE_TICKET);
  const canManageTemplates = currentUserPermissions.includes(SUPPORT_CENTER_PERMISSIONS.MANAGE_TEMPLATES);

  const handleReply = async (body: string) => {
    setReplySubmitting(true);
    try {
      await ticketService.draftReply(ticketId, { body });
      refetch();
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setAiSuggestion('Dear customer,\n\nThank you for contacting ResQAI support. I have reviewed your request and will be happy to assist you. Our team will follow up within the next 4 hours with a detailed response.\n\nBest regards,\nSupport Team');
    setAiLoading(false);
  };

  const handleAcceptAI = async () => {
    if (!aiSuggestion) return;
    await handleReply(aiSuggestion);
    setAiSuggestion(null);
  };

  const handleTemplateSelect = async (tpl: TemplateDTO) => {
    await ticketService.draftReply(ticketId, { body: tpl.body });
    refetch();
  };

  const handleOwnerChange = async (agentId: string) => {
    await ticketService.update(ticketId, { ownerId: agentId });
    refetch();
  };

  const handleEscalate = async () => {
    const reason = window.prompt('Escalation reason:');
    if (!reason) return;
    await ticketService.escalate(ticketId, { reason, escalateTo: 'Team Lead' });
    refetch();
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div>
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = '#/'; }} style={{ marginBottom: 4 }} aria-label="Back to ticket queue">
          ← Back to Queue
        </Button>
        {detail ? (
          <>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e6ecf5' }}>{detail.ticket.subject}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
              <span style={{ fontSize: 12, color: '#8b9bb5' }}>Ticket #{ticketId}</span>
              {detail.ticket.slaDeadline && (
                <SLAStopwatch deadline={detail.ticket.slaDeadline} />
              )}
            </div>
          </>
        ) : (
          <Skeleton variant="text" width={300} height={24} />
        )}
      </div>
      {detail && (
        <StatusBadge variant={detail.ticket.status === 'resolved' || detail.ticket.status === 'closed' ? 'success' : detail.ticket.status === 'escalated' ? 'error' : 'info'}>
          {detail.ticket.status}
        </StatusBadge>
      )}
    </div>
  );

  const tabs = (
    <Tabs tabs={detailTabs} activeId={activeTab} onChange={setActiveTab} />
  );

  const renderTabContent = () => {
    if (!detail) return null;

    switch (activeTab) {
      case 'thread':
        return (
          <div>
            <MessageThread messages={detail.messages} loading={false} />
            <Card variant="bordered" style={{ marginTop: 16 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#e6ecf5' }}>Reply</h3>
              <PermissionGuard permission={SUPPORT_CENTER_PERMISSIONS.DRAFT_REPLY} fallback={<p style={{ fontSize: 12, color: '#8b9bb5', fontStyle: 'italic' }}>You do not have permission to reply to tickets.</p>}>
                {aiSuggestion && (
                  <AIReplySuggestion
                    suggestion={aiSuggestion}
                    onAccept={handleAcceptAI}
                    onEdit={() => {}}
                    onReject={() => setAiSuggestion(null)}
                    confidence={0.92}
                  />
                )}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <PermissionGuard permission={SUPPORT_CENTER_PERMISSIONS.MANAGE_TEMPLATES}>
                    <TemplateSelector templates={templates} onSelect={handleTemplateSelect} />
                  </PermissionGuard>
                  {canDraft && (
                    <Button size="sm" variant="ghost" onClick={handleGenerateAI} loading={aiLoading}>
                      Generate AI Reply
                    </Button>
                  )}
                </div>
                <ReplyEditor onSubmit={handleReply} submitting={replySubmitting} />
              </PermissionGuard>
            </Card>
          </div>
        );
      case 'activity':
        return (
          <div>
            <TicketHistoryTimeline events={detail.timeline} loading={false} />
          </div>
        );
      case 'customer':
        return (
          <Card variant="bordered">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Name</span><p style={{ margin: '2px 0', color: '#e6ecf5' }}>{detail.customer.name}</p></div>
              <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Email</span><p style={{ margin: '2px 0', color: '#e6ecf5' }}>{detail.customer.email}</p></div>
              {detail.customer.phone && <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Phone</span><p style={{ margin: '2px 0', color: '#e6ecf5' }}>{detail.customer.phone}</p></div>}
              {detail.customer.accountName && <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Account</span><p style={{ margin: '2px 0', color: '#e6ecf5' }}>{detail.customer.accountName}</p></div>}
            </div>
          </Card>
        );
      case 'related':
        return (
          <div>
            {detail.relatedAppointments.length === 0 && detail.relatedDisputes.length === 0 ? (
              <EmptyState title="No related records" description="No appointments or disputes linked to this ticket." size="sm" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {detail.relatedAppointments.length > 0 && (
                  <Card variant="bordered">
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#e6ecf5' }}>Appointments ({detail.relatedAppointments.length})</h4>
                  </Card>
                )}
                {detail.relatedDisputes.length > 0 && (
                  <Card variant="bordered">
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#e6ecf5' }}>Disputes ({detail.relatedDisputes.length})</h4>
                  </Card>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div style={{ padding: 24 }} role="alert">
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = '#/'; }} style={{ marginBottom: 16 }} aria-label="Back to queue">← Back to Queue</Button>
        <ErrorState title="Failed to load ticket" message={error} onRetry={refetch} />
      </div>
    );
  }

  const sidebarContent = detail ? (
    <div>
      <TicketDetailPanel detail={detail} loading={false} error={null} onRetry={refetch} />
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <span style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Assign to</span>
          <OwnerAssigner
            value={detail.ticket.ownerId}
            onChange={handleOwnerChange}
            agents={agentOptions}
          />
        </div>
        <PermissionGuard permission={SUPPORT_CENTER_PERMISSIONS.ESCALATE_TICKET}>
          <Button size="sm" variant="danger" onClick={handleEscalate} style={{ marginTop: 8 }}>
            Escalate Ticket
          </Button>
        </PermissionGuard>
      </div>
    </div>
  ) : (
    <div>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="text" style={{ marginBottom: 12 }} />)}</div>
  );

  return (
    <DetailLayout
      header={header}
      tabs={tabs}
      sidebar={sidebarContent}
      sidebarPosition="right"
      sidebarWidth={320}
    >
      {renderTabContent()}
    </DetailLayout>
  );
};
