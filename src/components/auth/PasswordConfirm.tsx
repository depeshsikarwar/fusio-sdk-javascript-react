import React, { useState, useCallback, useId } from "react";
import { CommonMessageException, type CommonMessage } from "fusio-sdk";
import { ClientException } from "sdkgen-client";
import { useFusio } from "../../context/FusioContext";
import { Message } from "../common/Message";
import type { BaseComponentProps } from "../../types";

export interface PasswordConfirmLabels {
  title?: string;
  subtitle?: string;
  tokenLabel?: string;
  tokenPlaceholder?: string;
  newPasswordLabel?: string;
  newPasswordPlaceholder?: string;
  confirmPasswordLabel?: string;
  confirmPasswordPlaceholder?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  submitButton?: string;
  submittingButton?: string;
  loginButton?: string;
  passwordMismatchError?: string;
}

export interface PasswordConfirmProps extends BaseComponentProps {
  /**
   * The reset token from email URL query parameter.
   */
  token?: string;

  /**
   * Callback fired on successful password reset.
   */
  onSuccess?: (response: CommonMessage) => void;

  /**
   * Callback fired when reset execution fails.
   */
  onError?: (error: Error | CommonMessage) => void;

  /**
   * Callback when "Sign in with new password" is clicked.
   */
  onLoginClick?: () => void;

  /**
   * Custom labels.
   */
  labels?: PasswordConfirmLabels;

  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

export const PasswordConfirm: React.FC<PasswordConfirmProps> = ({
  token: initialToken = "",
  onSuccess,
  onError,
  onLoginClick,
  labels = {},
  renderHeader,
  renderFooter,
  className = "",
  style,
  id,
}) => {
  const { anonymousClient } = useFusio();

  const baseId = useId();
  const tokenId = `${baseId}-token`;
  const passwordId = `${baseId}-new-password`;
  const confirmId = `${baseId}-confirm-password`;

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [responseMessage, setResponseMessage] = useState<CommonMessage | { success: boolean; message: string } | null>(null);

  const mergedLabels: Required<PasswordConfirmLabels> = {
    title: labels.title ?? "Set New Password",
    subtitle: labels.subtitle ?? "Enter your reset token and your new password",
    tokenLabel: labels.tokenLabel ?? "Reset Token",
    tokenPlaceholder: labels.tokenPlaceholder ?? "Enter token from reset email",
    newPasswordLabel: labels.newPasswordLabel ?? "New Password",
    newPasswordPlaceholder: labels.newPasswordPlaceholder ?? "••••••••",
    confirmPasswordLabel: labels.confirmPasswordLabel ?? "Confirm New Password",
    confirmPasswordPlaceholder: labels.confirmPasswordPlaceholder ?? "••••••••",
    showPasswordLabel: labels.showPasswordLabel ?? "Show password",
    hidePasswordLabel: labels.hidePasswordLabel ?? "Hide password",
    submitButton: labels.submitButton ?? "Reset Password",
    submittingButton: labels.submittingButton ?? "Updating password...",
    loginButton: labels.loginButton ?? "Proceed to Sign In",
    passwordMismatchError: labels.passwordMismatchError ?? "The entered passwords do not match.",
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!token.trim() || !newPassword) {
        setResponseMessage({
          success: false,
          message: "Please fill in all required fields.",
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        setResponseMessage({
          success: false,
          message: mergedLabels.passwordMismatchError,
        });
        return;
      }

      setLoading(true);
      setResponseMessage(null);

      try {
        const response = await anonymousClient.consumer().account().executePasswordReset({
          token: token.trim(),
          newPassword,
        });

        setIsSuccess(true);
        setResponseMessage(response);
        onSuccess?.(response);
      } catch (err: unknown) {
        let msg = "Could not reset password. The token may be expired or invalid.";

        if (err instanceof CommonMessageException) {
          const commonMsg = (err as unknown as { message: string }).message;
          msg = commonMsg || msg;
          setResponseMessage({ success: false, message: msg });
          onError?.(err as unknown as CommonMessage);
        } else if (err instanceof ClientException) {
          msg = err.message || "Reset failed.";
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
    [anonymousClient, token, newPassword, confirmPassword, mergedLabels.passwordMismatchError, onSuccess, onError]
  );

  return (
    <div
      id={id}
      className={`fusio-component fusio-confirm-card ${className}`.trim()}
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

      {isSuccess ? (
        <div className="fusio-success-actions">
          {onLoginClick && (
            <button
              type="button"
              onClick={onLoginClick}
              className="fusio-button fusio-button-primary"
            >
              {mergedLabels.loginButton}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="fusio-form" noValidate={false}>
          {/* Only show token input if token is not prefilled */}
          <div className="fusio-form-group">
            <label htmlFor={tokenId} className="fusio-label">
              {mergedLabels.tokenLabel}
            </label>
            <input
              id={tokenId}
              name="token"
              type="text"
              required
              placeholder={mergedLabels.tokenPlaceholder}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              className="fusio-input"
            />
          </div>

          <div className="fusio-form-group">
            <label htmlFor={passwordId} className="fusio-label">
              {mergedLabels.newPasswordLabel}
            </label>
            <div className="fusio-password-wrapper">
              <input
                id={passwordId}
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder={mergedLabels.newPasswordPlaceholder}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          <div className="fusio-form-group">
            <label htmlFor={confirmId} className="fusio-label">
              {mergedLabels.confirmPasswordLabel}
            </label>
            <input
              id={confirmId}
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder={mergedLabels.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="fusio-input"
            />
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
      )}

      {renderFooter && renderFooter()}
    </div>
  );
};
