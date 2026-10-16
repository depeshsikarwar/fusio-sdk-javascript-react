// Context & Provider
export { FusioContext, FusioProvider, useFusio } from "./context/FusioContext";
export type { FusioProviderProps } from "./context/FusioContext";

// Hooks
export { useFusioClient, useCustomClient } from "./hooks/useFusioClient";
export { useAuth } from "./hooks/useAuth";

// Components
export { Message } from "./components/common/Message";
export type { MessageProps } from "./components/common/Message";

export { Login } from "./components/auth/Login";
export type { LoginProps, LoginLabels } from "./components/auth/Login";

export { Register } from "./components/auth/Register";
export type { RegisterProps, RegisterLabels } from "./components/auth/Register";

export { Activate } from "./components/auth/Activate";
export type { ActivateProps, ActivateLabels } from "./components/auth/Activate";

export { PasswordReset } from "./components/auth/PasswordReset";
export type { PasswordResetProps, PasswordResetLabels } from "./components/auth/PasswordReset";

export { PasswordConfirm } from "./components/auth/PasswordConfirm";
export type { PasswordConfirmProps, PasswordConfirmLabels } from "./components/auth/PasswordConfirm";

export { ChangePassword } from "./components/auth/ChangePassword";
export type { ChangePasswordProps, ChangePasswordLabels } from "./components/auth/ChangePassword";

// Types
export * from "./types";

// Re-exports from underlying Fusio & SDKgen SDKs for convenience
export { Client, CommonMessageException } from "fusio-sdk";
export {
  HttpBearer,
  OAuth2,
  SessionTokenStore,
  LocalStorageTokenStore,
  MemoryTokenStore,
  ClientException,
} from "sdkgen-client";
