import type { FC } from 'react';
import { Button } from '../../../shared/src/components';

interface AccountQuickActionsProps {
  accountId: string;
  onCreateFollowup?: (accountId: string) => void;
  onScheduleScan?: (accountId: string) => void;
  onAddNote?: (accountId: string) => void;
}

export const AccountQuickActions: FC<AccountQuickActionsProps> = ({ accountId, onCreateFollowup, onScheduleScan, onAddNote }) => {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {onCreateFollowup && (
        <Button variant="primary" size="sm" onClick={() => onCreateFollowup(accountId)}>
          + Followup
        </Button>
      )}
      {onScheduleScan && (
        <Button variant="secondary" size="sm" onClick={() => onScheduleScan(accountId)}>
          Run Scan
        </Button>
      )}
      {onAddNote && (
        <Button variant="ghost" size="sm" onClick={() => onAddNote(accountId)}>
          Add Note
        </Button>
      )}
    </div>
  );
};
