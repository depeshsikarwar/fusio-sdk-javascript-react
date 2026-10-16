import React, { useState, useCallback, useId } from "react";
import { CommonMessageException, type CommonMessage } from "fusio-sdk";
import { ClientException } from "sdkgen-client";
import { useFusio } from "../../context/FusioContext";
import { Message } from "../common/Message";
import type { BaseComponentProps } from "../../types";

export interface ChangePasswordLabels {
  title?: string;
  subtitle?: string;
  oldPasswordLabel?: string;
  oldPasswordPlaceholder?: string;
  newPasswordLabel?: string;
  newPasswordPlaceholder?: string;
  verifyPasswordLabel?: string;
  verifyPasswordPlaceholder?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  submitButton?: string;
  submittingButton?: string;
  passwordMismatchError?: string;
}

export interface ChangePasswordProps extends BaseComponentProps {
  /**
   * Callback fired on successful password change.
   */
  onSuccess?: (response: CommonMessage) => void;

  /**
   * Callback fired when password change fails.
   */
  onError?: (error: Error | CommonMessage) => void;

  /**
   * Custom labels.
   */
  labels?: ChangePasswordLabels;

  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({
  onSuccess,
  onError,
  labels = {},
  renderHeader,
  renderFooter,
  className = "",
  style,
  id,
}) => {
  const { client, isAuthenticated } = useFusio();

  const baseId = useId();
  const oldPasswordId = `${baseId}-old-password`;
  const newPasswordId = `${baseId}-new-password`;
  const verifyPasswordId = `${baseId}-verify-password`;

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<CommonMessage | { success: boolean; message: string } | null>(null);

  const mergedLabels: Required<ChangePasswordLabels> = {
    title: labels.title ?? "Change Password",
    subtitle: labels.subtitle ?? "Update your password to keep your account secure",
    oldPasswordLabel: labels.oldPasswordLabel ?? "Current Password",
    oldPasswordPlaceholder: labels.oldPasswordPlaceholder ?? "••••••••",
    newPasswordLabel: labels.newPasswordLabel ?? "New Password",
    newPasswordPlaceholder: labels.newPasswordPlaceholder ?? "••••••••",
    verifyPasswordLabel: labels.verifyPasswordLabel ?? "Confirm New Password",
    verifyPasswordPlaceholder: labels.verifyPasswordPlaceholder ?? "••••••••",
    showPasswordLabel: labels.showPasswordLabel ?? "Show password",
    hidePasswordLabel: labels.hidePasswordLabel ?? "Hide password",
    submitButton: labels.submitButton ?? "Update Password",
    submittingButton: labels.submittingButton ?? "Updating...",
    passwordMismatchError: labels.passwordMismatchError ?? "The new passwords do not match.",
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isAuthenticated) {
        setResponseMessage({
          success: false,
          message: "You must be signed in to change your password.",
        });
        return;
      }

      if (!oldPassword || !newPassword || !verifyPassword) {
        setResponseMessage({
          success: false,
          message: "Please fill in all password fields.",
        });
        return;
      }

      if (newPassword !== verifyPassword) {
        setResponseMessage({
          success: false,
          message: mergedLabels.passwordMismatchError,
        });
        return;
      }

      setLoading(true);
      setResponseMessage(null);

      try {
        const response = await client.consumer().account().changePassword({
          oldPassword,
          newPassword,
          verifyPassword,
        });

        setResponseMessage(response);
        onSuccess?.(response);

        // Clear password inputs on success
        setOldPassword("");
        setNewPassword("");
        setVerifyPassword("");
      } catch (err: unknown) {
        let msg = "Could not change password. Please verify your current password.";

        if (err instanceof CommonMessageException) {
          const commonMsg = (err as unknown as { message: string }).message;
          msg = commonMsg || msg;
          setResponseMessage({ success: false, message: msg });
          onError?.(err as unknown as CommonMessage);
        } else if (err instanceof ClientException) {
          msg = err.message || "Password change failed.";
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
    [client, isAuthenticated, oldPassword, newPassword, verifyPassword, mergedLabels.passwordMismatchError, onSuccess, onError]
  );

  return (
    <div
      id={id}
      className={`fusio-component fusio-change-password-card ${className}`.trim()}
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
          <label htmlFor={oldPasswordId} className="fusio-label">
            {mergedLabels.oldPasswordLabel}
          </label>
          <div className="fusio-password-wrapper">
            <input
              id={oldPasswordId}
              name="oldPassword"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder={mergedLabels.oldPasswordPlaceholder}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
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
          <label htmlFor={newPasswordId} className="fusio-label">
            {mergedLabels.newPasswordLabel}
          </label>
          <input
            id={newPasswordId}
            name="newPassword"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder={mergedLabels.newPasswordPlaceholder}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            className="fusio-input"
          />
        </div>

        <div className="fusio-form-group">
          <label htmlFor={verifyPasswordId} className="fusio-label">
            {mergedLabels.verifyPasswordLabel}
          </label>
          <input
            id={verifyPasswordId}
            name="verifyPassword"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder={mergedLabels.verifyPasswordPlaceholder}
            value={verifyPassword}
            onChange={(e) => setVerifyPassword(e.target.value)}
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

      {renderFooter && renderFooter()}
    </div>
  );
};
