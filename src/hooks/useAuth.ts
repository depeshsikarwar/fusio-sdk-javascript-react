import { useFusio } from "../context/FusioContext";

/**
 * Hook providing direct access to authentication state and actions.
 */
export function useAuth() {
  const { user, token, isAuthenticated, isLoading, error, login, logout, refreshUser } = useFusio();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
  };
}
