import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Client } from "fusio-sdk";
import {
  HttpBearer,
  MemoryTokenStore,
  SessionTokenStore,
  type CredentialsInterface,
  type TokenStoreInterface,
} from "sdkgen-client";
import type {
  ConsumerUserAccount,
  ConsumerUserJWT,
  FusioConfig,
  FusioContextValue,
} from "../types";

export const FusioContext = createContext<FusioContextValue | null>(null);

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function resolveTokenStore(config: FusioConfig): TokenStoreInterface {
  if (config.tokenStore) {
    return config.tokenStore;
  }

  const prefix = config.instance ? `fusio_token_${config.instance}` : "fusio_access_token";

  if (typeof window !== "undefined" && window.sessionStorage) {
    return new SessionTokenStore(prefix);
  }

  return new MemoryTokenStore();
}

export interface FusioProviderProps {
  config: FusioConfig;
  children: React.ReactNode;
}

export const FusioProvider: React.FC<FusioProviderProps> = ({ config, children }) => {
  const normalizedBaseUrl = useMemo(() => normalizeBaseUrl(config.baseUrl), [config.baseUrl]);

  const tokenStore = useMemo(() => resolveTokenStore(config), [config]);

  const [token, setToken] = useState<string | null>(() => {
    try {
      const stored = tokenStore.get();
      return stored?.access_token || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<ConsumerUserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Anonymous client for public routes (e.g. register, password reset, login)
  const anonymousClient = useMemo(() => {
    return new Client(normalizedBaseUrl, null);
  }, [normalizedBaseUrl]);

  // Authenticated client using current Bearer token
  const client = useMemo(() => {
    const credentials: CredentialsInterface | null = token ? new HttpBearer(token) : null;
    return new Client(normalizedBaseUrl, credentials);
  }, [normalizedBaseUrl, token]);

  const logout = useCallback(() => {
    try {
      tokenStore.remove();
    } catch {
      // ignore storage removal errors
    }
    setToken(null);
    setUser(null);
    setError(null);
    config.onTokenChange?.(null);
    config.onUserChange?.(null);
  }, [tokenStore, config]);

  const fetchUserProfile = useCallback(
    async (activeClient: Client): Promise<ConsumerUserAccount | null> => {
      try {
        const account = await activeClient.consumer().account().get();
        setUser(account);
        config.onUserChange?.(account);
        return account;
      } catch (err: unknown) {
        // If unauthorized or token expired, trigger logout
        const message = err instanceof Error ? err.message : String(err);
        if (
          message.toLowerCase().includes("unauthorized") ||
          message.toLowerCase().includes("invalid token") ||
          message.toLowerCase().includes("401") ||
          message.toLowerCase().includes("403")
        ) {
          logout();
        }
        return null;
      }
    },
    [logout, config]
  );

  const refreshUser = useCallback(async (): Promise<ConsumerUserAccount | null> => {
    if (!token) return null;
    setIsLoading(true);
    try {
      return await fetchUserProfile(client);
    } finally {
      setIsLoading(false);
    }
  }, [token, client, fetchUserProfile]);

  const login = useCallback(
    async (jwt: ConsumerUserJWT, initialUser?: ConsumerUserAccount): Promise<ConsumerUserAccount> => {
      const accessToken = jwt.token;
      if (!accessToken) {
        throw new Error("Login failed: Access token missing in response.");
      }

      // Persist in store
      try {
        tokenStore.persist({
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: jwt.expires_in || 3600,
          refresh_token: jwt.refresh_token || "",
          scope: jwt.scope || "",
        });
      } catch (err) {
        console.warn("Could not persist Fusio token to store:", err);
      }

      setToken(accessToken);
      config.onTokenChange?.(accessToken);

      if (initialUser) {
        setUser(initialUser);
        config.onUserChange?.(initialUser);
        return initialUser;
      }

      // Fetch freshly authenticated user account
      const authClient = new Client(normalizedBaseUrl, new HttpBearer(accessToken));
      const profile = await authClient.consumer().account().get();
      setUser(profile);
      config.onUserChange?.(profile);
      return profile;
    },
    [normalizedBaseUrl, tokenStore, config]
  );

  const createClient = useCallback(
    <T extends Client = Client>(
      customFactory?: (baseUrl: string, credentials?: CredentialsInterface | null) => T
    ): T => {
      const credentials: CredentialsInterface | null = token ? new HttpBearer(token) : null;
      if (customFactory) {
        return customFactory(normalizedBaseUrl, credentials);
      }
      return new Client(normalizedBaseUrl, credentials) as T;
    },
    [normalizedBaseUrl, token]
  );

  // Load user profile on mount if token is already present
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (!token || config.autoFetchUser === false) {
        if (isMounted) setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const authClient = new Client(normalizedBaseUrl, new HttpBearer(token));
        const account = await authClient.consumer().account().get();
        if (isMounted) {
          setUser(account);
          config.onUserChange?.(account);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [normalizedBaseUrl, token, config.autoFetchUser, logout, config]);

  const value: FusioContextValue = useMemo(
    () => ({
      config,
      client,
      anonymousClient,
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      error,
      login,
      logout,
      refreshUser,
      createClient,
    }),
    [
      config,
      client,
      anonymousClient,
      user,
      token,
      isLoading,
      error,
      login,
      logout,
      refreshUser,
      createClient,
    ]
  );

  return <FusioContext.Provider value={value}>{children}</FusioContext.Provider>;
};

export function useFusio(): FusioContextValue {
  const context = useContext(FusioContext);
  if (!context) {
    throw new Error("useFusio must be used within a <FusioProvider>.");
  }
  return context;
}
