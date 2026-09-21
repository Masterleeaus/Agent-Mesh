import { useState, useEffect, type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';
import type { TechnicianProfileVM } from '../models/view-models';

export const TechnicianProfilePage: FC = () => {
  const { addNotification } = useAppContext();
  const [profile, setProfile] = useState<TechnicianProfileVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await technicianService.getProfile();
        setProfile(res);
        setName(res.name);
        setPhone(res.phone);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await technicianService.updateProfile({ name, phone });
      setProfile(prev => prev ? { ...prev, name, phone } : prev);
      setEditing(false);
      addNotification({ type: 'success', title: 'Profile updated', message: 'Your profile has been updated.' });
    } catch {
      addNotification({ type: 'error', title: 'Failed to update', message: 'Could not save profile changes.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={400} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load profile" message={error} />}</div>;
  if (!profile) return null;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Technician Profile</h1>
        {!editing && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>}
      </div>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#243049',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#41d1c4', fontSize: 24, fontWeight: 700,
          }}>
            {profile.name[0]}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#e6ecf5' }}>{profile.name}</h2>
            <span style={{ fontSize: 13, color: '#8b9bb5' }}>{profile.role.replace('_', ' ')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: profile.isOnline ? '#4ecdc4' : '#5a6a85',
              }} />
              <span style={{ fontSize: 12, color: profile.isOnline ? '#4ecdc4' : '#5a6a85' }}>
                {profile.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {editing ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
                  border: '1px solid #243049', borderRadius: 6, fontSize: 13,
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Email</label>
              <p style={{ margin: '4px 0', fontSize: 13, color: '#8b9bb5' }}>{profile.email}</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Phone</label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
                  border: '1px solid #243049', borderRadius: 6, fontSize: 13,
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handleSave} disabled={saving} loading={saving}>Save</Button>
              <Button variant="ghost" onClick={() => { setEditing(false); setName(profile.name); setPhone(profile.phone); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Email</span>
              <p style={{ margin: '4px 0', color: '#e6ecf5' }}>{profile.email}</p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Phone</span>
              <p style={{ margin: '4px 0', color: '#e6ecf5' }}>{profile.phone}</p>
            </div>
          </div>
        )}
      </Card>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Performance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#41d1c4' }}>{profile.todayCompleted}</p>
            <span style={{ fontSize: 11, color: '#8b9bb5' }}>Today</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#4ecdc4' }}>{profile.todayTotal}</p>
            <span style={{ fontSize: 11, color: '#8b9bb5' }}>Assigned</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f0c040' }}>{profile.completionRate}%</p>
            <span style={{ fontSize: 11, color: '#8b9bb5' }}>Rate</span>
          </div>
        </div>
      </Card>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Skills</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {profile.skills.map(skill => (
            <span key={skill} style={{
              background: 'rgba(65,209,196,0.1)', color: '#41d1c4',
              padding: '4px 10px', borderRadius: 12, fontSize: 12,
            }}>{skill}</span>
          ))}
        </div>
      </Card>

      <Card variant="bordered">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Certifications</h3>
        {profile.certifications.length === 0 ? (
          <p style={{ fontSize: 13, color: '#5a6a85', fontStyle: 'italic' }}>No certifications listed.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile.certifications.map(cert => (
              <span key={cert} style={{
                background: 'rgba(240,192,64,0.1)', color: '#f0c040',
                padding: '4px 10px', borderRadius: 12, fontSize: 12,
              }}>{cert}</span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
