import React, { useState } from "react";
import {
  FusioProvider,
  Login,
  Register,
  PasswordReset,
  PasswordConfirm,
  Activate,
  ChangePassword,
  useAuth,
  useFusioClient,
} from "fusio-sdk-javascript-react";

type ActiveTab = "login" | "register" | "reset" | "confirm" | "activate" | "change-password";

function DemoContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");
  const { user, token, isAuthenticated, logout, refreshUser } = useAuth();
  const { baseUrl } = useFusioClient();
  const [lastAction, setLastAction] = useState<string>("");

  return (
    <div className="demo-container">
      <header className="demo-header">
        <div className="demo-brand">
          <span className="demo-badge">React SDK</span>
          <h1>Fusio React SDK Playground</h1>
        </div>
        <p className="demo-tagline">
          Connected to: <code>{baseUrl}</code>
        </p>
      </header>

      {/* Auth Status Banner */}
      <section className="demo-auth-status">
        <div className="status-indicator">
          <span className={`status-dot ${isAuthenticated ? "online" : "offline"}`} />
          <strong>Status:</strong> {isAuthenticated ? "Authenticated" : "Unauthenticated"}
        </div>

        {isAuthenticated && user && (
          <div className="status-details">
            <span>
              Signed in as: <strong>{user.name || user.email}</strong>
            </span>
            <span className="token-preview">
              Token: <code>{token ? `${token.slice(0, 15)}...` : "none"}</code>
            </span>
            <div className="status-actions">
              <button onClick={() => refreshUser()} className="demo-btn demo-btn-secondary">
                Refresh Profile
              </button>
              <button onClick={() => logout()} className="demo-btn demo-btn-danger">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Navigation Tabs */}
      <nav className="demo-tabs">
        <button
          className={`demo-tab ${activeTab === "login" ? "active" : ""}`}
          onClick={() => setActiveTab("login")}
        >
          Login
        </button>
        <button
          className={`demo-tab ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          Register
        </button>
        <button
          className={`demo-tab ${activeTab === "reset" ? "active" : ""}`}
          onClick={() => setActiveTab("reset")}
        >
          Password Reset
        </button>
        <button
          className={`demo-tab ${activeTab === "confirm" ? "active" : ""}`}
          onClick={() => setActiveTab("confirm")}
        >
          Confirm Reset
        </button>
        <button
          className={`demo-tab ${activeTab === "activate" ? "active" : ""}`}
          onClick={() => setActiveTab("activate")}
        >
          Activate Account
        </button>
        <button
          className={`demo-tab ${activeTab === "change-password" ? "active" : ""}`}
          onClick={() => setActiveTab("change-password")}
        >
          Change Password
        </button>
      </nav>

      {/* Component Area */}
      <main className="demo-main">
        {activeTab === "login" && (
          <Login
            onSuccess={(u) => {
              setLastAction(`Login successful for ${u.name || u.email}`);
            }}
            onError={(err) => {
              setLastAction(`Login error: ${"message" in err ? err.message : String(err)}`);
            }}
            onForgotPasswordClick={() => setActiveTab("reset")}
            onRegisterClick={() => setActiveTab("register")}
          />
        )}

        {activeTab === "register" && (
          <Register
            onSuccess={(res) => {
              setLastAction(`Registration successful: ${res.message}`);
            }}
            onError={(err) => {
              setLastAction(`Registration error: ${"message" in err ? err.message : String(err)}`);
            }}
            onLoginClick={() => setActiveTab("login")}
          />
        )}

        {activeTab === "reset" && (
          <PasswordReset
            onSuccess={(res) => {
              setLastAction(`Reset requested: ${res.message}`);
            }}
            onError={(err) => {
              setLastAction(`Reset error: ${"message" in err ? err.message : String(err)}`);
            }}
            onLoginClick={() => setActiveTab("login")}
          />
        )}

        {activeTab === "confirm" && (
          <PasswordConfirm
            onSuccess={(res) => {
              setLastAction(`Password updated: ${res.message}`);
            }}
            onError={(err) => {
              setLastAction(`Password update error: ${"message" in err ? err.message : String(err)}`);
            }}
            onLoginClick={() => setActiveTab("login")}
          />
        )}

        {activeTab === "activate" && (
          <Activate
            autoActivate={false}
            onSuccess={(res) => {
              setLastAction(`Account activated: ${res.message}`);
            }}
            onError={(err) => {
              setLastAction(`Activation error: ${"message" in err ? err.message : String(err)}`);
            }}
            onLoginClick={() => setActiveTab("login")}
          />
        )}

        {activeTab === "change-password" && (
          <ChangePassword
            onSuccess={(res) => {
              setLastAction(`Password changed: ${res.message}`);
            }}
            onError={(err) => {
              setLastAction(`Change password error: ${"message" in err ? err.message : String(err)}`);
            }}
          />
        )}
      </main>

      {/* Last Event Log */}
      {lastAction && (
        <aside className="demo-event-log">
          <strong>Last Callback Event:</strong> {lastAction}
        </aside>
      )}
    </div>
  );
}

export default function App() {
  const [apiUrl, setApiUrl] = useState("https://api.fusio-project.org");

  return (
    <div className="demo-wrapper">
      <div className="demo-config-bar">
        <label htmlFor="fusio-url-input">Fusio API URL:</label>
        <input
          id="fusio-url-input"
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="http://localhost:8080"
        />
      </div>

      <FusioProvider config={{ baseUrl: apiUrl, autoFetchUser: true }}>
        <DemoContent />
      </FusioProvider>
    </div>
  );
}
