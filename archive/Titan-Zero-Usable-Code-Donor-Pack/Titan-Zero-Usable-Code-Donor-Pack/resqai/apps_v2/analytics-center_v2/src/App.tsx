import React from 'react';
import { Routes } from './routes';
import { AppProvider } from './state';

export default function App() {
  return (
    <AppProvider>
      <div style={{ minHeight: '100vh', background: '#0b1220', color: '#e6ecf5' }}>
        <Routes />
      </div>
    </AppProvider>
  );
}
