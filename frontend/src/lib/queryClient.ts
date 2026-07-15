import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared QueryClient instance. Defaults are tuned conservatively:
 * facilitator data doesn't change every second, so we avoid refetching
 * on every window focus and retry failed requests sparingly.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
