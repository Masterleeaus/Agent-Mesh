import type { ReactNode } from 'react';
import { AuthGuard } from 'lemma-sdk/react';
import { LemmaClient } from 'lemma-sdk';
import { environment } from '../config/environment';

function SignInView({ client }: { client: LemmaClient }) {
  const handleSignIn = () => {
    const params: Record<string, string> = {};
    if (environment.appId) params.app_id = environment.appId;
    if (environment.clientId) params.client_id = environment.clientId;
    client.auth.redirectToAuth({ params });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb',
        gap: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          padding: '40px 48px',
          textAlign: 'center',
          maxWidth: '360px',
          width: '100%',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#111827',
            margin: '0 auto 20px',
          }}
        />
        <h1 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: '#111827' }}>
          Sign in to continue
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>
          You need to be signed in to access this app.
        </p>
        <button
          onClick={handleSignIn}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

export function ProtectedApp({ client, children }: { client: LemmaClient; children: ReactNode }) {
  return (
    <AuthGuard
      client={client}
      unauthenticatedFallback={<SignInView client={client} />}
    >
      {children}
    </AuthGuard>
  );
}
