import { useEffect, useState, createContext, useContext } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { NodeLibrary } from './components/NodeLibrary';
import { NodeConfiguration } from './components/panels/NodeConfiguration';
import { WorkflowToolbar } from './components/WorkflowToolbar';
import { useWorkflowStore } from './hooks/useWorkflowStore';
import './styles/globals.css';

// ── Theme context ────────────────────────────────────────────────
type Theme = 'dark' | 'light';
interface ThemeCtx { theme: Theme; toggle: () => void; }
export const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

function App() {
  const { loadNodeTypes, selectedNode } = useWorkflowStore();
  const [theme, setTheme] = useState<Theme>('dark');

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem('aspire-theme') as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.add('light');
      html.classList.remove('dark');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    localStorage.setItem('aspire-theme', theme);
  }, [theme]);

  useEffect(() => { loadNodeTypes(); }, [loadNodeTypes]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <ReactFlowProvider>
        <div className="h-screen flex flex-col" style={{ background: 'var(--bg-canvas)', transition: 'background 0.2s' }}>
          <WorkflowToolbar />

          <div className="flex flex-1 overflow-hidden">
            <NodeLibrary />

            <div className="flex-1 relative overflow-hidden">
              <WorkflowCanvas />
            </div>

            {selectedNode && (
              <div
                className="animate-slide-in-right"
                style={{
                  width: 300,
                  borderLeft: '1px solid var(--border-subtle)',
                  background: 'var(--bg-sidebar)',
                  overflow: 'hidden auto',
                  transition: 'background 0.2s',
                }}
              >
                <NodeConfiguration />
              </div>
            )}
          </div>
        </div>
      </ReactFlowProvider>
    </ThemeContext.Provider>
  );
}

export default App;
