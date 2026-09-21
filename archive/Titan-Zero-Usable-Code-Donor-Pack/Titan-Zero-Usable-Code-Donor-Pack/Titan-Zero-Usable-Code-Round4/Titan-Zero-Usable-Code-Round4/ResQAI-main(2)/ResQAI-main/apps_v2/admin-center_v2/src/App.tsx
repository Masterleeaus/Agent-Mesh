import { AppLayout } from './layouts';
import { Routes } from './routes';
import { AppProvider } from './state';

export default function App() {
  return (
    <AppProvider>
      <Routes />
    </AppProvider>
  );
}
