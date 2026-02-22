import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/AuthProvider';
import './styles/tokens.css';
import './styles/tokens-light.css';
import './styles/command.css';
import './styles/global.css';
import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          (error.status === 401 || error.status === 403)
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

const rootElement = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);

// Command Center routes have no pre-rendered HTML — always use createRoot there.
// Public site routes use hydrateRoot to attach to the SSG-rendered HTML.
const isCommandCenter = window.location.pathname.startsWith('/command');
if (rootElement.hasChildNodes() && !isCommandCenter) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
