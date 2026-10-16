import type {
  Client,
  CommonMessage,
  ConsumerIdentity,
  ConsumerIdentityCollection,
  ConsumerUserAccount,
  ConsumerUserActivate,
  ConsumerUserEmail,
  ConsumerUserJWT,
  ConsumerUserLogin,
  ConsumerUserPasswordReset,
  ConsumerUserRefresh,
  ConsumerUserRegister,
  BackendAccountChangePassword,
} from "fusio-sdk";
import type { CredentialsInterface, TokenStoreInterface } from "sdkgen-client";

export type {
  Client,
  CommonMessage,
  ConsumerIdentity,
  ConsumerIdentityCollection,
  ConsumerUserAccount,
  ConsumerUserActivate,
  ConsumerUserEmail,
  ConsumerUserJWT,
  ConsumerUserLogin,
  ConsumerUserPasswordReset,
  ConsumerUserRefresh,
  ConsumerUserRegister,
  BackendAccountChangePassword,
  CredentialsInterface,
  TokenStoreInterface,
};

/**
 * Configuration options for FusioProvider.
 */
export interface FusioConfig {
  /**
   * The base URL of the Fusio backend API (e.g. "https://api.fusio-project.org" or "http://localhost:8080").
   */
  baseUrl: string;

  /**
   * Optional App ID registered in Fusio (used for OAuth2 identity providers).
   */
  appId?: number | string;

  /**
   * Optional App Key registered in Fusio.
   */
  appKey?: string;

  /**
   * Optional instance identifier, useful for multi-tenant setups or separate storage namespaces.
   */
  instance?: string;

  /**
   * Optional custom token store. Defaults to SessionTokenStore.
   */
  tokenStore?: TokenStoreInterface;

  /**
   * Whether to automatically fetch user account details on mount when an existing token is stored.
   * Defaults to true.
   */
  autoFetchUser?: boolean;

  /**
   * Callback fired when the access token changes.
   */
  onTokenChange?: (token: string | null) => void;

  /**
   * Callback fired when the authenticated user profile changes.
   */
  onUserChange?: (user: ConsumerUserAccount | null) => void;
}

/**
 * The value exposed by FusioContext.
 */
export interface FusioContextValue {
  /**
   * The active configuration.
   */
  config: FusioConfig;

  /**
   * Authenticated Fusio Client instance (authorized with current Bearer token or OAuth2).
   */
  client: Client;

  /**
   * Anonymous Fusio Client instance (unauthenticated, for public endpoints).
   */
  anonymousClient: Client;

  /**
   * Currently authenticated user details, or null if not logged in.
   */
  user: ConsumerUserAccount | null;

  /**
   * Current access token string, or null if unauthenticated.
   */
  token: string | null;

  /**
   * Whether the user is currently authenticated with a valid token.
   */
  isAuthenticated: boolean;

  /**
   * Whether the provider is currently initializing / fetching user profile.
   */
  isLoading: boolean;

  /**
   * Any initialization or authentication error.
   */
  error: Error | null;

  /**
   * Log in with a JWT response and optional initial user account details.
   */
  login: (jwt: ConsumerUserJWT, user?: ConsumerUserAccount) => Promise<ConsumerUserAccount>;

  /**
   * Log out, removing token from store and clearing user session.
   */
  logout: () => void;

  /**
   * Refresh user account details from the Fusio API.
   */
  refreshUser: () => Promise<ConsumerUserAccount | null>;

  /**
   * Factory to create typed SDK clients for custom generated endpoints.
   */
  createClient: <T extends Client = Client>(
    customFactory?: (baseUrl: string, credentials?: CredentialsInterface | null) => T
  ) => T;
}

/**
 * Common styling and override props for components.
 */
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

/**
 * Message status for feedback banners.
 */
export interface DisplayMessage {
  success: boolean;
  message: string;
}
