import type { Dispute, Appointment, Customer } from '../types';
import { listRecords, updateRecord, runAgent, waitForAgentResponse, logOperation } from '../../../../packages/sdk/lemma-sdk';
import { errorMessage } from '../../../../packages/utils/service-helpers';

export async function fetchDisputes(): Promise<Dispute[]> {
  return listRecords<Dispute>('disputes', 200);
}

export async function fetchAppointments(): Promise<Appointment[]> {
  return listRecords<Appointment>('appointments', 200);
}

export async function fetchCustomers(): Promise<Customer[]> {
  return listRecords<Customer>('customers', 200);
}

export async function analyzeDispute(dispute: Dispute): Promise<void> {
  await updateRecord('disputes', dispute.id, { status: 'analyzing' });
  await logOperation('analyze_dispute', `Started analysis for dispute ${dispute.id}`, 'agent:resolution-advisor');

  try {
    const prompt = JSON.stringify({ dispute_id: dispute.id, force_reanalysis: true });
    const conv = await runAgent('resolution-advisor', prompt, `Analyze dispute ${dispute.id}`);
    const response = await waitForAgentResponse(conv.id);
    const parsed = JSON.parse(response);

    const status = parsed.analysis_status;

    switch (status) {
      case 'ready_for_review': {
        const resolution = parsed.recommended_resolution;
        const reason = parsed.resolution_reason;
        const confidence = parsed.confidence;
        if (!resolution || !reason || confidence == null) {
          throw new Error('Agent response missing required fields for ready_for_review');
        }
        await updateRecord('disputes', dispute.id, {
          recommended_resolution: resolution,
          resolution_reason: reason,
          confidence,
          status: 'recommendation_ready',
        });
        await logOperation('analyze_dispute', `Analyzed dispute ${dispute.id}: ${resolution} (${Math.round(confidence * 100)}% confident)`, 'agent:resolution-advisor');
        break;
      }
      case 'already_analyzed': {
        await updateRecord('disputes', dispute.id, { status: 'recommendation_ready' });
        await logOperation('analyze_dispute', `Dispute ${dispute.id} already analyzed; prior recommendation preserved`, 'agent:resolution-advisor');
        break;
      }
      case 'insufficient_evidence': {
        await updateRecord('disputes', dispute.id, { status: 'open' });
        await logOperation('analyze_dispute', `Analysis paused for dispute ${dispute.id}: insufficient evidence`, 'agent:resolution-advisor');
        break;
      }
      case 'safety_escalation': {
        await updateRecord('disputes', dispute.id, { status: 'open' });
        await logOperation('analyze_dispute', `Safety escalation for dispute ${dispute.id}`, 'agent:resolution-advisor');
        break;
      }
      case 'legal_escalation': {
        await updateRecord('disputes', dispute.id, { status: 'open' });
        await logOperation('analyze_dispute', `Legal escalation for dispute ${dispute.id}`, 'agent:resolution-advisor');
        break;
      }
      case 'blocked': {
        const blockReason = parsed.block_reason ?? 'Unknown reason';
        await updateRecord('disputes', dispute.id, { status: 'open' });
        await logOperation('analyze_dispute', `Analysis blocked for dispute ${dispute.id}: ${blockReason}`, 'agent:resolution-advisor');
        break;
      }
      default: {
        await updateRecord('disputes', dispute.id, { status: 'open' });
        await logOperation('analyze_dispute', `Unknown analysis_status ${status} for dispute ${dispute.id}`, 'agent:resolution-advisor');
        break;
      }
    }
  } catch (err) {
    await updateRecord('disputes', dispute.id, { status: 'open' });
    await logOperation('analyze_dispute', `Analysis failed for dispute ${dispute.id}: ${errorMessage(err)}`, 'agent:resolution-advisor');
    throw err;
  }
}

export async function searchRedditCommunity(query: string): Promise<string[]> {
  try {
    const { runConnectorOperation } = await import('../../../../packages/sdk/lemma-sdk');
    const result = await runConnectorOperation('resqai-reddit', 'search_posts', {
      query,
      limit: 3,
    });
    return (result as { results?: string[] }).results ?? [];
  } catch {
    return [];
  }
}

export async function approveResolution(dispute: Dispute, customer: Customer | null): Promise<void> {
  const resolutionType = dispute.recommended_resolution;

  await updateRecord('disputes', dispute.id, { status: 'approved' });
  await logOperation('approve_resolution', `Approved resolution ${resolutionType} for dispute ${dispute.id}`);

  if (customer) {
    let newStatus: string;
    switch (resolutionType) {
      case 'full_refund':
      case 'partial_refund':
      case 'redo_service':
      case 'discount_credit':
      case 'no_action':
        newStatus = 'active';
        break;
      case 'escalate_legal':
        newStatus = 'in_dispute';
        break;
      default:
        newStatus = customer.status ?? 'active';
    }
    await updateRecord('customers', customer.id, { status: newStatus });
    await logOperation('apply_customer_impact', `Updated customer ${customer.id} status to ${newStatus} based on resolution ${resolutionType}`);
  }
}

export async function rejectDispute(dispute: Dispute): Promise<void> {
  await updateRecord('disputes', dispute.id, { status: 'rejected' });
  await logOperation('reject_dispute', `Rejected resolution for dispute ${dispute.id}`);
}

export async function closeDispute(dispute: Dispute): Promise<void> {
  await updateRecord('disputes', dispute.id, { status: 'closed' });
  await logOperation('close_dispute', `Closed dispute ${dispute.id}`);
}

export async function overrideResolution(dispute: Dispute, overrideNotes: string): Promise<void> {
  await updateRecord('disputes', dispute.id, {
    status: 'approved',
    human_notes: overrideNotes,
  });
  await logOperation('override_resolution', `Override resolution for dispute ${dispute.id}: ${overrideNotes}`);
}
