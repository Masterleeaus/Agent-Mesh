import { useServiceTypes } from '../hooks';
import { Dropdown, Skeleton } from '../../../shared/src/components';
import type { ServiceTypeDTO } from '../models/dto';

interface ServiceTypeSelectorProps {
  value?: string;
  onChange: (id: string) => void;
  error?: string;
}

export function ServiceTypeSelector({ value, onChange, error }: ServiceTypeSelectorProps) {
  const { services, loading } = useServiceTypes();

  if (loading) {
    return <Skeleton variant="text" height={40} />;
  }

  const options = services.map((s: ServiceTypeDTO) => ({
    value: s.id,
    label: s.name,
    description: `${s.durationMinutes} min · ${s.description}`,
  }));

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select service type..."
      searchable
      error={error}
      label="Service Type"
    />
  );
}
