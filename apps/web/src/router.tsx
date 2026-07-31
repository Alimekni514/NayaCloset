import { createRouter, RouterProvider } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { routeTree } from './routeTree.gen';

export const createAppRouter = (queryClient: QueryClient) =>
  createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
  });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}

export { RouterProvider };
