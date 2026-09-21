import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LemmaClient, setTestingToken } from 'lemma-sdk';
import { setClient } from '../../../packages/sdk/lemma-sdk';
import { ProtectedApp } from '../../../packages/sdk/ProtectedApp';
import { environment } from '../../../packages/config/environment';
import App from './App';

const lemmaToken = import.meta.env.VITE_LEMMA_TOKEN;
if (lemmaToken) { setTestingToken(lemmaToken); }
const client = new LemmaClient({ podId: environment.podId, apiUrl: environment.apiUrl, authUrl: environment.authUrl });
setClient(client);
createRoot(document.getElementById('root')!).render(<StrictMode><ProtectedApp client={client}><App /></ProtectedApp></StrictMode>);
