import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Card, Form, Input, Button } from '../../../../shared/src/components';
import type { ProfileVM } from '../../models/view-models';
import type { UpdateProfileRequest } from '../../models/api-requests';

interface UpdateProfileFormProps {
  profile: ProfileVM;
  saving: boolean;
  onSave: (req: UpdateProfileRequest) => Promise<void>;
}

export function UpdateProfileForm({ profile, saving, onSave }: UpdateProfileFormProps) {
  const [form, setForm] = useState<UpdateProfileRequest>({ firstName: '', lastName: '', email: '', phone: '', address: '' });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setForm({ firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phone: profile.phone, address: profile.address });
  }, [profile]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!form.firstName.trim()) errs.push('First name is required');
    if (!form.lastName.trim()) errs.push('Last name is required');
    if (!form.email.trim()) errs.push('Email is required');
    if (!form.email.includes('@')) errs.push('Invalid email address');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
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
        {errors.length > 0 && (
          <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid #e74c3c', borderRadius: 8, padding: 12 }}>
            {errors.map((err, i) => <div key={i} style={{ color: '#e74c3c', fontSize: 13 }}>{err}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
        </div>
      </Form>
    </Card>
  );
}