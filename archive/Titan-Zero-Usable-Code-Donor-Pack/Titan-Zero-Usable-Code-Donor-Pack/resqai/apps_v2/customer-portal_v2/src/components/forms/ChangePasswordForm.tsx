import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Card, Form, Input, Button } from '../../../../shared/src/components';
import { CustomerService } from '../../services/customer-service';
import type { ChangePasswordRequest } from '../../models/api-requests';

interface ChangePasswordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!currentPassword) errs.push('Current password is required');
    if (!newPassword) errs.push('New password is required');
    if (newPassword.length < 8) errs.push('New password must be at least 8 characters');
    if (newPassword !== confirmPassword) errs.push('Passwords do not match');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors([]);
    try {
      const req: ChangePasswordRequest = { currentPassword, newPassword, confirmPassword };
      await CustomerService.changePassword(req);
      onSuccess();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to change password']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="md">
      <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16, display: 'block' }}>Change Password</span>
      <Form onSubmit={handleSubmit} layout="vertical">
        <Input label="Current Password" type="password" value={currentPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)} required />
        <Input label="New Password" type="password" value={newPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} required placeholder="At least 8 characters" />
        <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} required />
        {errors.length > 0 && (
          <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid #e74c3c', borderRadius: 8, padding: 12 }}>
            {errors.map((err, i) => <div key={i} style={{ color: '#e74c3c', fontSize: 13 }}>{err}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" loading={submitting}>Change Password</Button>
        </div>
      </Form>
    </Card>
  );
}