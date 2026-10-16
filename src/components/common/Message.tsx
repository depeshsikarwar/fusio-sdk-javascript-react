import React from "react";
import type { CommonMessage } from "fusio-sdk";
import type { BaseComponentProps } from "../../types";

export interface MessageProps extends BaseComponentProps {
  message?: CommonMessage | { success?: boolean; message?: string } | string | null;
  onDismiss?: () => void;
}

export const Message: React.FC<MessageProps> = ({
  message,
  onDismiss,
  className = "",
  style,
  id,
}) => {
  if (!message) return null;

  let isSuccess = false;
  let text = "";

  if (typeof message === "string") {
    text = message;
    isSuccess = false;
  } else {
    isSuccess = Boolean(message.success);
    text = message.message || (isSuccess ? "Operation successful" : "An error occurred");
  }

  if (!text) return null;

  const alertTypeClass = isSuccess ? "fusio-message-success" : "fusio-message-error";

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`fusio-message ${alertTypeClass} ${className}`.trim()}
      style={style}
    >
      <div className="fusio-message-content">
        <span className="fusio-message-icon" aria-hidden="true">
          {isSuccess ? "✓" : "⚠"}
        </span>
        <span className="fusio-message-text">{text}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="fusio-message-dismiss"
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  );
};
