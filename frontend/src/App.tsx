import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/features/auth/AuthContext";
import { AppRouter } from "@/routes/AppRouter";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

/**
 * Root component. ErrorBoundary catches unhandled render errors anywhere
 * below it (instead of a blank white screen). ThemeProvider wraps
 * everything (so dark mode applies even to /login, before a session
 * exists), AuthProvider tracks session + role, and AppRouter handles
 * routing.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
