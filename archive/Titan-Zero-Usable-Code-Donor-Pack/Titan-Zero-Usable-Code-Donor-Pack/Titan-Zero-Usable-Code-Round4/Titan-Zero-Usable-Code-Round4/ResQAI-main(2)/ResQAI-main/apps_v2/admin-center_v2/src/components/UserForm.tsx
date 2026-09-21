import { useState, type FC } from 'react';
import { Card, Form, Button, Input } from '@resqai/foundation';
import type { CreateUserRequest } from '../models';

const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 24, maxWidth: 600 };

export const UserForm: FC<{ onSubmit: (req: CreateUserRequest) => void; loading?: boolean }> = ({ onSubmit, loading }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [appAccess, setAppAccess] = useState<string[]>([]);
  const [sendInvite, setSendInvite] = useState(false);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ email, name, role, appAccess, sendInvite }); };

  return (
    <Card style={cardStyle}>
      <Form onSubmit={handleSubmit}>
        <Form.Field label="Email" required><Input value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="user@resqai.com" /></Form.Field>
        <Form.Field label="Full Name" required><Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="John Doe" /></Form.Field>
        <Form.Field label="Role" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[['Super Admin', 'Super Admin'], ['Support Manager', 'Support Manager'], ['Support Agent', 'Support Agent'], ['Technician', 'Technician'], ['Analyst', 'Analyst'], ['Viewer', 'Viewer']].map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e6ecf5', fontSize: 13 }}>
                <input type="radio" name="role" checked={role === val} onChange={() => setRole(val)} style={{ accentColor: '#41d1c4' }} />
                {label}
              </label>
            ))}
          </div>
        </Form.Field>
        <Form.Field label="App Access">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[['admin', 'Admin Center'], ['support', 'Support Center'], ['analytics', 'Analytics Center'], ['technician', 'Technician Portal'], ['crm', 'CRM Center']].map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e6ecf5', fontSize: 13 }}>
                <input type="checkbox" checked={appAccess.includes(val)} onChange={() => setAppAccess(appAccess.includes(val) ? appAccess.filter(a => a !== val) : [...appAccess, val])} style={{ accentColor: '#41d1c4' }} />
                {label}
              </label>
            ))}
          </div>
        </Form.Field>
        <Form.Field label="Send Invite">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e6ecf5', fontSize: 14 }}>
            <input type="checkbox" checked={sendInvite} onChange={e => setSendInvite(e.target.checked)} style={{ accentColor: '#41d1c4' }} />
            Send invitation email
          </label>
        </Form.Field>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <Button type="submit" loading={loading} disabled={loading}>Create User</Button>
        </div>
      </Form>
    </Card>
  );
};
