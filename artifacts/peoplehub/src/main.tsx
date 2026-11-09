import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import './index.css';

const container = document.getElementById('root')!;
const tree = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
const onCaughtError = (error: unknown, errorInfo: { componentStack?: string }) => {
  console.error(error, errorInfo.componentStack);
};

if (container.hasChildNodes()) {
  hydrateRoot(container, tree, { onCaughtError });
} else {
  createRoot(container, { onCaughtError }).render(tree);
}
