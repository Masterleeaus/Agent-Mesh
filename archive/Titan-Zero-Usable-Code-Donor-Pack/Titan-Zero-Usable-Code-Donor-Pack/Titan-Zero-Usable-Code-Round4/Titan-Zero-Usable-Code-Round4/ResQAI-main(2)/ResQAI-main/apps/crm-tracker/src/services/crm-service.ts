import type { Account, Followup, Customer, AccountHealthScanResult, FlagSlippingFollowupsResult, SlippingFollowupItem } from '../types';
import { listRecords, runFunction } from '../../../../packages/sdk/lemma-sdk';

export async function fetchAccounts(): Promise<Account[]> {
  const items = await listRecords<Account>('accounts', 500);
  return items;
}

export async function fetchFollowups(): Promise<Followup[]> {
  const items = await listRecords<Followup>('followups', 500);
  return items.sort((a: Followup, b: Followup) => {
    const da = a.due_date ? new Date(a.due_date).getTime() : 0;
    const db = b.due_date ? new Date(b.due_date).getTime() : 0;
    return da - db;
  });
}

export async function fetchCustomers(): Promise<Customer[]> {
  return listRecords<Customer>('customers', 500);
}

export async function runAccountHealthScan(): Promise<AccountHealthScanResult> {
  const result = await runFunction<AccountHealthScanResult>('account_health_scan', {
    lookback_days: 90,
    write_back: true,
    top_n_riskiest: 5,
  });
  return result;
}

export async function runFlagSlippingFollowups(): Promise<FlagSlippingFollowupsResult> {
  const result = await runFunction<FlagSlippingFollowupsResult>('flag_slipping_followups', {
    days_ahead: 14,
    top_n: 30,
    include_statuses: ['pending', 'in_progress'],
  });
  return result;
}

export async function sendDiscordAlert(message: string, channel = 'support-alerts'): Promise<void> {
  try {
    const { runConnectorOperation } = await import('../../../../packages/sdk/lemma-sdk');
    await runConnectorOperation('resqai-discord', 'chat_post_message', {
      channel,
      text: message,
    });
  } catch {
    console.warn('Discord alert failed');
  }
}

export async function runFullHealthScan(): Promise<{
  scanResult: AccountHealthScanResult;
  slippingAlerts: SlippingFollowupItem[];
}> {
  const scanResult = await runAccountHealthScan();
  const slippingResult = await runFlagSlippingFollowups();
  return {
    scanResult,
    slippingAlerts: slippingResult.top || [],
  };
}

export async function refreshAll(): Promise<{
  accounts: Account[];
  followups: Followup[];
}> {
  const [accounts, followups] = await Promise.all([
    fetchAccounts(),
    fetchFollowups(),
  ]);
  return { accounts, followups };
}
