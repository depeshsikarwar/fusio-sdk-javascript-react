import React, { useState, useEffect, useCallback, useId } from "react";
import { CommonMessageException, type CommonMessage } from "fusio-sdk";
import { ClientException } from "sdkgen-client";
import { useFusio } from "../../context/FusioContext";
import { Message } from "../common/Message";
import type { BaseComponentProps } from "../../types";

export interface ActivateLabels {
  title?: string;
  subtitle?: string;
  tokenLabel?: string;
  tokenPlaceholder?: string;
  submitButton?: string;
  submittingButton?: string;
  loginButton?: string;
  autoActivatingText?: string;
}

export interface ActivateProps extends BaseComponentProps {
  /**
   * The activation token received via email. If passed, auto-activation can occur.
   */
  token?: string;

  /**
   * Whether to trigger activation automatically on mount if a token prop is provided.
   * Defaults to true.
   */
  autoActivate?: boolean;

  /**
   * Callback fired on successful activation.
   */
  onSuccess?: (response: CommonMessage) => void;

  /**
   * Callback fired when activation fails.
   */
  onError?: (error: Error | CommonMessage) => void;

  /**
   * Callback when "Go to Login" button is clicked.
   */
  onLoginClick?: () => void;

  /**
   * Custom labels.
   */
  labels?: ActivateLabels;

  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

export const Activate: React.FC<ActivateProps> = ({
  token: initialToken = "",
  autoActivate = true,
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

  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [responseMessage, setResponseMessage] = useState<CommonMessage | { success: boolean; message: string } | null>(null);

  const mergedLabels: Required<ActivateLabels> = {
    title: labels.title ?? "Activate Account",
    subtitle: labels.subtitle ?? "Enter your activation token to complete verification",
    tokenLabel: labels.tokenLabel ?? "Activation Token",
    tokenPlaceholder: labels.tokenPlaceholder ?? "Enter token from confirmation email",
    submitButton: labels.submitButton ?? "Activate Account",
    submittingButton: labels.submittingButton ?? "Activating...",
    loginButton: labels.loginButton ?? "Proceed to Sign In",
    autoActivatingText: labels.autoActivatingText ?? "Activating your account...",
  };

  const doActivate = useCallback(
    async (tokenToActivate: string) => {
      if (!tokenToActivate.trim()) {
        setResponseMessage({
          success: false,
          message: "Please enter a valid activation token.",
        });
        return;
      }

      setLoading(true);
      setResponseMessage(null);

      try {
        const response = await anonymousClient.consumer().account().activate({
          token: tokenToActivate.trim(),
        });

        setIsActivated(true);
        setResponseMessage(response);
        onSuccess?.(response);
      } catch (err: unknown) {
        let msg = "Could not activate account. The token may be expired or invalid.";

        if (err instanceof CommonMessageException) {
          const commonMsg = (err as unknown as { message: string }).message;
          msg = commonMsg || msg;
          setResponseMessage({ success: false, message: msg });
          onError?.(err as unknown as CommonMessage);
        } else if (err instanceof ClientException) {
          msg = err.message || "Activation failed.";
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
    [anonymousClient, onSuccess, onError]
  );

  // Auto-activate on mount if token is provided
  useEffect(() => {
    if (initialToken && autoActivate) {
      doActivate(initialToken);
    }
  }, [initialToken, autoActivate, doActivate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doActivate(token);
  };

  return (
    <div
      id={id}
      className={`fusio-component fusio-activate-card ${className}`.trim()}
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

      {isActivated ? (
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
