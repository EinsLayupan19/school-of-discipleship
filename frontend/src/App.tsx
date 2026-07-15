import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/features/auth/AuthContext";
import { AppRouter } from "@/routes/AppRouter";

/**
 * Root component. ThemeProvider wraps everything (so dark mode applies
 * even to /login, before a session exists), AuthProvider tracks session
 * + role, and AppRouter handles routing.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
