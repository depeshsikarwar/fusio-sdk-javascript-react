import React, { useState, useEffect, useCallback, useId } from "react";
import { CommonMessageException, type ConsumerIdentity, type ConsumerUserAccount, type ConsumerUserJWT, type CommonMessage } from "fusio-sdk";
import { ClientException } from "sdkgen-client";
import { useFusio } from "../../context/FusioContext";
import { Message } from "../common/Message";
import type { BaseComponentProps } from "../../types";

export interface LoginLabels {
  title?: string;
  subtitle?: string;
  usernameLabel?: string;
  usernamePlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  submitButton?: string;
  submittingButton?: string;
  forgotPasswordLink?: string;
  registerLink?: string;
  orDivider?: string;
}

export interface LoginProps extends BaseComponentProps {
  /**
   * Callback fired on successful login with authenticated user details and JWT.
   */
  onSuccess?: (user: ConsumerUserAccount, jwt: ConsumerUserJWT) => void;

  /**
   * Callback fired when an error occurs during login.
   */
  onError?: (error: Error | CommonMessage) => void;

  /**
   * Callback when "Forgot password?" is clicked.
   */
  onForgotPasswordClick?: () => void;

  /**
   * Callback when "Register" link is clicked.
   */
  onRegisterClick?: () => void;

  /**
   * Whether to display identity providers (OAuth/Third-party login).
   * Defaults to true if appId and appKey are provided in FusioConfig.
   */
  showIdentityProviders?: boolean;

  /**
   * Custom list of identity providers to display (skips fetching from API).
   */
  identityProviders?: ConsumerIdentity[];

  /**
   * OAuth redirect URI for third-party identity callbacks.
   */
  redirectUri?: string;

  /**
   * Whether to show the "Forgot Password?" action link. Defaults to true.
   */
  showForgotPasswordLink?: boolean;

  /**
   * Whether to show the "Register" action link. Defaults to true.
   */
  showRegisterLink?: boolean;

  /**
   * Optional custom label overrides.
   */
  labels?: LoginLabels;

  /**
   * Custom slots.
   */
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

export const Login: React.FC<LoginProps> = ({
  onSuccess,
  onError,
  onForgotPasswordClick,
  onRegisterClick,
  showIdentityProviders,
  identityProviders: propIdentities,
  redirectUri,
  showForgotPasswordLink = true,
  showRegisterLink = true,
  labels = {},
  renderHeader,
  renderFooter,
  className = "",
  style,
  id,
}) => {
  const { anonymousClient, login, config } = useFusio();

  const baseId = useId();
  const usernameId = `${baseId}-username`;
  const passwordId = `${baseId}-password`;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<CommonMessage | { success: boolean; message: string } | null>(null);

  const [identities, setIdentities] = useState<ConsumerIdentity[]>(propIdentities || []);
  const [loadingIdentities, setLoadingIdentities] = useState(false);

  const mergedLabels: Required<LoginLabels> = {
    title: labels.title ?? "Sign In",
    subtitle: labels.subtitle ?? "Enter your credentials to access your account",
    usernameLabel: labels.usernameLabel ?? "Username or Email",
    usernamePlaceholder: labels.usernamePlaceholder ?? "name@example.com",
    passwordLabel: labels.passwordLabel ?? "Password",
    passwordPlaceholder: labels.passwordPlaceholder ?? "••••••••",
    showPasswordLabel: labels.showPasswordLabel ?? "Show password",
    hidePasswordLabel: labels.hidePasswordLabel ?? "Hide password",
    submitButton: labels.submitButton ?? "Sign In",
    submittingButton: labels.submittingButton ?? "Signing in...",
    forgotPasswordLink: labels.forgotPasswordLink ?? "Forgot password?",
    registerLink: labels.registerLink ?? "Don't have an account? Sign up",
    orDivider: labels.orDivider ?? "Or continue with",
  };

  // Fetch identity providers if enabled
  useEffect(() => {
    if (propIdentities) {
      setIdentities(propIdentities);
      return;
    }

    const shouldFetch = showIdentityProviders ?? Boolean(config.appId && config.appKey);
    if (!shouldFetch || !config.appId || !config.appKey) {
      return;
    }

    const numericAppId =
      typeof config.appId === "number" ? config.appId : parseInt(String(config.appId), 10);

    if (isNaN(numericAppId)) {
      return;
    }

    let isMounted = true;
    setLoadingIdentities(true);

    anonymousClient
      .consumer()
      .identity()
      .getAll(numericAppId, config.appKey)
      .then((collection) => {
        if (isMounted && collection?.entry) {
          setIdentities(collection.entry);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch Fusio identity providers:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingIdentities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anonymousClient, config.appId, config.appKey, propIdentities, showIdentityProviders]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!username.trim() || !password) {
        setResponseMessage({
          success: false,
          message: "Please enter both username and password.",
        });
        return;
      }

      setLoading(true);
      setResponseMessage(null);

      try {
        // Authenticate against Fusio Consumer API
        const jwt = await anonymousClient.consumer().account().login({
          username: username.trim(),
          password,
        });

        // Set session and retrieve user account
        const user = await login(jwt);

        setResponseMessage({
          success: true,
          message: "Logged in successfully.",
        });

        onSuccess?.(user, jwt);
      } catch (err: unknown) {
        let msg = "Could not authenticate. Please check your credentials.";

        if (err instanceof CommonMessageException) {
          const commonMsg = (err as unknown as { message: string }).message;
          msg = commonMsg || msg;
          setResponseMessage({ success: false, message: msg });
          onError?.(err as unknown as CommonMessage);
        } else if (err instanceof ClientException) {
          msg = err.message || "Authentication failed.";
          setResponseMessage({ success: false, message: msg });
          onError?.(err);
        } else if (err instanceof Error) {
          msg = err.message;
          setResponseMessage({ success: false, message: msg });
          onError?.(err);
        } else {
          setResponseMessage({ success: false, message: String(err) });
          onError?.(new Error(String(err)));
        }
      } finally {
        setLoading(false);
      }
    },
    [anonymousClient, username, password, login, onSuccess, onError]
  );

  const getIdentityRedirectUrl = useCallback(
    (identity: ConsumerIdentity): string => {
      if (!identity.redirect) return "";
      try {
        const url = new URL(identity.redirect);
        const resolvedRedirect =
          redirectUri || (typeof window !== "undefined" ? window.location.href : "");
        if (resolvedRedirect) {
          url.searchParams.set("redirect_uri", resolvedRedirect);
        }
        return url.toString();
      } catch {
        return identity.redirect;
      }
    },
    [redirectUri]
  );

  return (
    <div
      id={id}
      className={`fusio-component fusio-login-card ${className}`.trim()}
      style={style}
    >
      {renderHeader ? (
        renderHeader()
      ) : (
        <div className="fusio-header">
          {mergedLabels.title && <h2 className="fusio-title">{mergedLabels.title}</h2>}
          {mergedLabels.subtitle && (
            <p className="fusio-subtitle">{mergedLabels.subtitle}</p>
          )}
        </div>
      )}

      <Message
        message={responseMessage}
        onDismiss={() => setResponseMessage(null)}
      />

      <form onSubmit={handleSubmit} className="fusio-form" noValidate={false}>
        <div className="fusio-form-group">
          <label htmlFor={usernameId} className="fusio-label">
            {mergedLabels.usernameLabel}
          </label>
          <input
            id={usernameId}
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder={mergedLabels.usernamePlaceholder}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="fusio-input"
          />
        </div>

        <div className="fusio-form-group">
          <div className="fusio-label-row">
            <label htmlFor={passwordId} className="fusio-label">
              {mergedLabels.passwordLabel}
            </label>
            {showForgotPasswordLink && onForgotPasswordClick && (
              <button
                type="button"
                onClick={onForgotPasswordClick}
                className="fusio-link-button"
              >
                {mergedLabels.forgotPasswordLink}
              </button>
            )}
          </div>
          <div className="fusio-password-wrapper">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder={mergedLabels.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="fusio-input fusio-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="fusio-password-toggle"
              aria-label={showPassword ? mergedLabels.hidePasswordLabel : mergedLabels.showPasswordLabel}
              title={showPassword ? mergedLabels.hidePasswordLabel : mergedLabels.showPasswordLabel}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="fusio-button fusio-button-primary"
        >
          {loading ? (
            <span className="fusio-button-content">
              <span className="fusio-spinner" aria-hidden="true" />
              <span>{mergedLabels.submittingButton}</span>
            </span>
          ) : (
            mergedLabels.submitButton
          )}
        </button>
      </form>

      {/* Identity Providers (OAuth / Social login) */}
      {(identities.length > 0 || loadingIdentities) && (
        <div className="fusio-oauth-section">
          <div className="fusio-divider">
            <span>{mergedLabels.orDivider}</span>
          </div>
          {loadingIdentities ? (
            <div className="fusio-oauth-loading">
              <span className="fusio-spinner" aria-hidden="true" />
            </div>
          ) : (
            <div className="fusio-oauth-buttons">
              {identities.map((identity) => (
                <a
                  key={identity.id || identity.name}
                  href={getIdentityRedirectUrl(identity)}
                  className="fusio-button fusio-button-outline fusio-oauth-button"
                >
                  {identity.icon && (
                    <img
                      src={identity.icon}
                      alt=""
                      aria-hidden="true"
                      className="fusio-oauth-icon"
                    />
                  )}
                  <span>{identity.name || "Sign in with provider"}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {showRegisterLink && onRegisterClick && (
        <div className="fusio-footer-links">
          <button
            type="button"
            onClick={onRegisterClick}
            className="fusio-link-button fusio-footer-link"
          >
            {mergedLabels.registerLink}
          </button>
        </div>
      )}

      {renderFooter && renderFooter()}
    </div>
  );
};
