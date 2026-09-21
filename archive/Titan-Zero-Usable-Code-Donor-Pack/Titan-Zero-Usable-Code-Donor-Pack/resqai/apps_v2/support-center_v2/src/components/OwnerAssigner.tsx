import { type FC } from 'react';
import { Dropdown } from '@resqai/foundation';
import type { DropdownOption } from '@resqai/foundation';

interface OwnerAssignerProps {
  value?: string;
  onChange: (agentId: string) => void;
  agents: DropdownOption[];
  loading?: boolean;
}

export const OwnerAssigner: FC<OwnerAssignerProps> = ({ value, onChange, agents, loading }) => {
  return (
    <Dropdown
      options={agents}
      value={value}
      onChange={onChange}
      placeholder="Assign to..."
      searchable
      loading={loading}
      size="sm"
    />
  );
};
