import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BootstrapProvider, ContentProvider, readWindowBootstrap } from '@/lib/content';
import { PublicRoutes, makeQueryClient } from '@/routes';

export { PublicApp, PublicRoutes } from '@/routes';

function App() {
  const [client] = useState(makeQueryClient);
  const [boot] = useState(readWindowBootstrap);
  return (
    <QueryClientProvider client={client}>
      <BootstrapProvider value={boot}>
        <ContentProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <PublicRoutes />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ContentProvider>
      </BootstrapProvider>
    </QueryClientProvider>
  );
}

export default App;
