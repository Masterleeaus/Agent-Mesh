import { AppProvider } from '../state/AppContext';
import { AppLayout } from '../layouts/AppLayout';
import { Routes } from './routes';

export default function App() {
  return (
    <AppProvider>
      <AppLayout>
        <Routes />
      </AppLayout>
    </AppProvider>
  );
}
