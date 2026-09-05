import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Vite `base` becomes import.meta.env.BASE_URL (e.g. "/Joy_and_Sid_Wedding_Invitation/").
  // TanStack Router expects a path prefix without a trailing slash.
  const rawBase = import.meta.env.BASE_URL || "/";
  const basepath = rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    ...(basepath ? { basepath } : {}),
  });

  return router;
};
