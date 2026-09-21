import { AppProvider } from './state/AppContext';
import { AppLayout } from './layouts/AppLayout';
import { Routes } from './routes';

const rootStyle: React.CSSProperties = {
  '--bg-page': '#0b1220',
  '--bg-card': '#131c2f',
  '--bg-elevated': '#1a2744',
  '--bg-topbar': '#131c2f',
  '--bg-sidebar': '#0f172a',
  '--bg-input': '#1a2744',
  '--border': '#243049',
  '--border-light': '#1a2744',
  '--text-primary': '#e6ecf5',
  '--text-secondary': '#8b9bb5',
  '--text-muted': '#6b7b95',
  '--accent': '#41d1c4',
  '--danger': '#e74c3c',
  '--warning': '#f0b429',
  '--success': '#2ecc71',
  '--font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
} as React.CSSProperties;

export default function App() {
  return (
    <div style={{ ...rootStyle, background: 'var(--bg-page, #0b1220)', color: 'var(--text-primary, #e6ecf5)', fontFamily: 'var(--font-family, sans-serif)', minHeight: '100vh' }}>
      <AppProvider>
        <AppLayout>
          <Routes />
        </AppLayout>
      </AppProvider>
    </div>
  );
}