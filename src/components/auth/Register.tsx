import React, { useState, useCallback, useId } from "react";
import { CommonMessageException, type CommonMessage } from "fusio-sdk";
import { ClientException } from "sdkgen-client";
import { useFusio } from "../../context/FusioContext";
import { Message } from "../common/Message";
import type { BaseComponentProps } from "../../types";

export interface RegisterLabels {
  title?: string;
  subtitle?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  passwordConfirmLabel?: string;
  passwordConfirmPlaceholder?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  submitButton?: string;
  submittingButton?: string;
  loginLink?: string;
  passwordMismatchError?: string;
}

export interface RegisterProps extends BaseComponentProps {
  /**
   * Callback fired on successful registration with Fusio CommonMessage response.
   */
  onSuccess?: (response: CommonMessage) => void;

  /**
   * Callback fired when an error occurs during registration.
   */
  onError?: (error: Error | CommonMessage) => void;

  /**
   * Callback when "Already have an account? Sign In" is clicked.
   */
  onLoginClick?: () => void;

  /**
   * Whether to display the login link. Defaults to true.
   */
  showLoginLink?: boolean;

  /**
   * Whether to require confirmation of password. Defaults to true.
   */
  requirePasswordConfirm?: boolean;

  /**
   * Optional reCAPTCHA or Turnstile token to pass with registration payload.
   */
  captchaToken?: string;

  /**
   * Optional custom label overrides.
   */
  labels?: RegisterLabels;

  /**
   * Custom slots.
   */
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  renderCaptcha?: (setCaptchaToken: (token: string) => void) => React.ReactNode;
}

export const Register: React.FC<RegisterProps> = ({
  onSuccess,
  onError,
  onLoginClick,
  showLoginLink = true,
  requirePasswordConfirm = true,
  captchaToken: initialCaptchaToken,
  labels = {},
  renderHeader,
  renderFooter,
  renderCaptcha,
  className = "",
  style,
  id,
}) => {
  const { anonymousClient } = useFusio();

  const baseId = useId();
  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;
  const passwordId = `${baseId}-password`;
  const confirmId = `${baseId}-confirm`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(initialCaptchaToken || "");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<CommonMessage | { success: boolean; message: string } | null>(null);

  const mergedLabels: Required<RegisterLabels> = {
    title: labels.title ?? "Create an Account",
    subtitle: labels.subtitle ?? "Sign up to get started with your account",
    nameLabel: labels.nameLabel ?? "Full Name / Username",
    namePlaceholder: labels.namePlaceholder ?? "Jane Doe",
    emailLabel: labels.emailLabel ?? "Email Address",
    emailPlaceholder: labels.emailPlaceholder ?? "jane@example.com",
    passwordLabel: labels.passwordLabel ?? "Password",
    passwordPlaceholder: labels.passwordPlaceholder ?? "••••••••",
    passwordConfirmLabel: labels.passwordConfirmLabel ?? "Confirm Password",
    passwordConfirmPlaceholder: labels.passwordConfirmPlaceholder ?? "••••••••",
    showPasswordLabel: labels.showPasswordLabel ?? "Show password",
    hidePasswordLabel: labels.hidePasswordLabel ?? "Hide password",
    submitButton: labels.submitButton ?? "Register",
    submittingButton: labels.submittingButton ?? "Creating account...",
    loginLink: labels.loginLink ?? "Already have an account? Sign in",
    passwordMismatchError: labels.passwordMismatchError ?? "The entered passwords do not match.",
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim() || !email.trim() || !password) {
        setResponseMessage({
          success: false,
          message: "Please fill in all required fields.",
        });
        return;
      }

      if (requirePasswordConfirm && password !== passwordConfirm) {
        setResponseMessage({
          success: false,
          message: mergedLabels.passwordMismatchError,
        });
        return;
      }

      setLoading(true);
      setResponseMessage(null);

      try {
        const response = await anonymousClient.consumer().account().register({
          name: name.trim(),
          email: email.trim(),
          password,
          captcha: captchaToken || undefined,
        });

        setResponseMessage(response);
        onSuccess?.(response);

        // Reset inputs on success
        setName("");
        setEmail("");
        setPassword("");
        setPasswordConfirm("");
      } catch (err: unknown) {
        let msg = "Could not register account. Please try again.";

        if (err instanceof CommonMessageException) {
          const commonMsg = (err as unknown as { message: string }).message;
          msg = commonMsg || msg;
          setResponseMessage({ success: false, message: msg });
          onError?.(err as unknown as CommonMessage);
        } else if (err instanceof ClientException) {
          msg = err.message || "Registration failed.";
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
    [
      anonymousClient,
      name,
      email,
      password,
      passwordConfirm,
      requirePasswordConfirm,
      captchaToken,
      mergedLabels.passwordMismatchError,
      onSuccess,
      onError,
    ]
  );

  return (
    <div
      id={id}
      className={`fusio-component fusio-register-card ${className}`.trim()}
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
          <label htmlFor={nameId} className="fusio-label">
            {mergedLabels.nameLabel}
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder={mergedLabels.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="fusio-input"
          />
        </div>

        <div className="fusio-form-group">
          <label htmlFor={emailId} className="fusio-label">
            {mergedLabels.emailLabel}
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={mergedLabels.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="fusio-input"
          />
        </div>

        <div className="fusio-form-group">
          <label htmlFor={passwordId} className="fusio-label">
            {mergedLabels.passwordLabel}
          </label>
          <div className="fusio-password-wrapper">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
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

        {requirePasswordConfirm && (
          <div className="fusio-form-group">
            <label htmlFor={confirmId} className="fusio-label">
              {mergedLabels.passwordConfirmLabel}
            </label>
            <input
              id={confirmId}
              name="passwordConfirm"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder={mergedLabels.passwordConfirmPlaceholder}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={loading}
              className="fusio-input"
            />
          </div>
        )}

        {renderCaptcha && renderCaptcha(setCaptchaToken)}

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

      {showLoginLink && onLoginClick && (
        <div className="fusio-footer-links">
          <button
            type="button"
            onClick={onLoginClick}
            className="fusio-link-button fusio-footer-link"
          >
            {mergedLabels.loginLink}
          </button>
        </div>
      )}

      {renderFooter && renderFooter()}
    </div>
  );
};
