import { type FC } from 'react';
import { Dropdown } from '@resqai/foundation';
import type { DropdownOption } from '@resqai/foundation';
import type { TemplateDTO } from '../models/dto';

interface TemplateSelectorProps {
  templates: TemplateDTO[];
  onSelect: (template: TemplateDTO) => void;
  loading?: boolean;
}

export const TemplateSelector: FC<TemplateSelectorProps> = ({ templates, onSelect, loading }) => {
  const options: DropdownOption[] = templates.map(t => ({
    value: t.id,
    label: t.name,
    description: t.category,
  }));

  return (
    <Dropdown
      options={options}
      value={undefined}
      onChange={(val) => {
        const tpl = templates.find(t => t.id === val);
        if (tpl) onSelect(tpl);
      }}
      placeholder="Insert template..."
      searchable
      loading={loading}
      size="sm"
      noOptionsMessage="No templates available"
    />
  );
};
