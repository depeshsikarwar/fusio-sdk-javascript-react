import React, { useState, useCallback, useId } from "react";
import { CommonMessageException, type CommonMessage } from "fusio-sdk";
import { ClientException } from "sdkgen-client";
import { useFusio } from "../../context/FusioContext";
import { Message } from "../common/Message";
import type { BaseComponentProps } from "../../types";

export interface PasswordResetLabels {
  title?: string;
  subtitle?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  submitButton?: string;
  submittingButton?: string;
  backToLoginLink?: string;
}

export interface PasswordResetProps extends BaseComponentProps {
  /**
   * Callback fired on successful password reset request.
   */
  onSuccess?: (response: CommonMessage) => void;

  /**
   * Callback fired when request fails.
   */
  onError?: (error: Error | CommonMessage) => void;

  /**
   * Callback when "Back to sign in" is clicked.
   */
  onLoginClick?: () => void;

  /**
   * Whether to show back to login link. Defaults to true.
   */
  showLoginLink?: boolean;

  /**
   * Optional captcha token.
   */
  captchaToken?: string;

  /**
   * Custom labels.
   */
  labels?: PasswordResetLabels;

  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  renderCaptcha?: (setCaptchaToken: (token: string) => void) => React.ReactNode;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({
  onSuccess,
  onError,
  onLoginClick,
  showLoginLink = true,
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
  const emailId = `${baseId}-email`;

  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState(initialCaptchaToken || "");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<CommonMessage | { success: boolean; message: string } | null>(null);

  const mergedLabels: Required<PasswordResetLabels> = {
    title: labels.title ?? "Reset Password",
    subtitle: labels.subtitle ?? "Enter your email address and we will send you a reset link",
    emailLabel: labels.emailLabel ?? "Email Address",
    emailPlaceholder: labels.emailPlaceholder ?? "name@example.com",
    submitButton: labels.submitButton ?? "Send Reset Link",
    submittingButton: labels.submittingButton ?? "Sending link...",
    backToLoginLink: labels.backToLoginLink ?? "Back to Sign In",
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email.trim()) {
        setResponseMessage({
          success: false,
          message: "Please enter your email address.",
        });
        return;
      }

      setLoading(true);
      setResponseMessage(null);

      try {
        const response = await anonymousClient.consumer().account().requestPasswordReset({
          email: email.trim(),
          captcha: captchaToken || undefined,
        });

        setResponseMessage(response);
        onSuccess?.(response);
      } catch (err: unknown) {
        let msg = "Could not send password reset email. Please try again.";

        if (err instanceof CommonMessageException) {
          const commonMsg = (err as unknown as { message: string }).message;
          msg = commonMsg || msg;
          setResponseMessage({ success: false, message: msg });
          onError?.(err as unknown as CommonMessage);
        } else if (err instanceof ClientException) {
          msg = err.message || "Request failed.";
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
    [anonymousClient, email, captchaToken, onSuccess, onError]
  );

  return (
    <div
      id={id}
      className={`fusio-component fusio-reset-card ${className}`.trim()}
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
            {mergedLabels.backToLoginLink}
          </button>
        </div>
      )}

      {renderFooter && renderFooter()}
    </div>
  );
};
