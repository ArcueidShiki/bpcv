import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './i18n';
import './theme.css';

export function mount(App: ComponentType) {
  const el = document.getElementById('root');
  if (!el) throw new Error('#root missing');
  createRoot(el).render(<StrictMode><LangProvider><App /></LangProvider></StrictMode>);
}
