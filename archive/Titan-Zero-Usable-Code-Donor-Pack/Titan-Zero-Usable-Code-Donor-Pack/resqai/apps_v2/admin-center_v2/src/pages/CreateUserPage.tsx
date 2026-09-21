import { useState } from 'react';
import { Card, Button } from '@resqai/foundation';
import { UserForm } from '../components/UserForm';
import type { CreateUserRequest } from '../models';
import { createUser } from '../services/admin-service';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const backStyle: React.CSSProperties = { color: '#41d1c4', fontSize: 13, cursor: 'pointer', textDecoration: 'none' };

export function CreateUserPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (req: CreateUserRequest) => {
    setSubmitting(true);
    try {
      await createUser(req);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={pageStyle}>
        <Card style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 24, maxWidth: 600, textAlign: 'center' }}>
          <div style={{ color: '#41d1c4', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>User Created Successfully</div>
          <div style={{ color: '#8b9bb5', fontSize: 14, marginBottom: 16 }}>The user has been created and an invitation email has been sent.</div>
          <Button onClick={() => { window.location.hash = '#/users'; }}>Back to Users</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div><a style={backStyle} onClick={() => { window.location.hash = '#/users'; }}>← Back to Users</a></div>
      <div style={titleStyle}>Create User</div>
      <UserForm onSubmit={handleSubmit} loading={submitting} />
    </div>
  );
}
