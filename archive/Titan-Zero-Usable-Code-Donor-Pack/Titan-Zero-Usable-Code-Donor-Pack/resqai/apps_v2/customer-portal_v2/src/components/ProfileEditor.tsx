import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Card, Form, Input, Button } from '../../../shared/src/components';
import type { ProfileVM } from '../models/view-models';
import type { UpdateProfileRequest } from '../models/api-requests';

interface ProfileEditorProps {
  profile: ProfileVM;
  saving: boolean;
  onSave: (req: UpdateProfileRequest) => void;
}

export function ProfileEditor({ profile, saving, onSave }: ProfileEditorProps) {
  const [form, setForm] = useState<UpdateProfileRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    });
  }, [profile]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Card padding="md">
      <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16, display: 'block' }}>Profile Information</span>
      <Form onSubmit={handleSubmit} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="First Name" value={form.firstName} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last Name" value={form.lastName} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" type="tel" value={form.phone} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: e.target.value })} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
        </div>
      </Form>
    </Card>
  );
}
