import { useTechnicians } from '../hooks';
import { Dropdown, Skeleton } from '../../../shared/src/components';
import type { TechnicianDTO } from '../models/dto';

interface TechnicianPickerProps {
  value?: string;
  onChange: (id: string) => void;
  error?: string;
}

export function TechnicianPicker({ value, onChange, error }: TechnicianPickerProps) {
  const { technicians, loading } = useTechnicians();

  if (loading) {
    return <Skeleton variant="text" height={40} />;
  }

  const options = technicians.map((t: TechnicianDTO) => ({
    value: t.id,
    label: `${t.name} (${t.skills.join(', ')}) · ★${t.rating}`,
    description: `${t.activeAppointments} active · ${t.availability.join(', ')}`,
  }));

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select technician..."
      searchable
      error={error}
      label="Technician"
    />
  );
}
