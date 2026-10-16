import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { FusioProvider, useFusio } from "../src";
import { MemoryTokenStore } from "sdkgen-client";

function TestConsumer() {
  const { isAuthenticated, user, token, logout, login } = useFusio();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? "authenticated" : "anonymous"}</div>
      <div data-testid="token">{token || "none"}</div>
      <div data-testid="user-name">{user?.name || "anonymous"}</div>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
      <button
        onClick={() =>
          login({ token: "test_jwt_123", expires_in: 3600 }, { id: 1, name: "Test User" })
        }
        data-testid="login-btn"
      >
        Login
      </button>
    </div>
  );
}

describe("FusioProvider & useFusio", () => {
  it("provides anonymous client and initial unauthenticated state", () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <TestConsumer />
      </FusioProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(screen.getByTestId("user-name")).toHaveTextContent("anonymous");
  });

  it("updates state upon calling login and logout", async () => {
    const tokenStore = new MemoryTokenStore();
    const onTokenChange = vi.fn();
    const onUserChange = vi.fn();

    render(
      <FusioProvider
        config={{
          baseUrl: "https://api.fusio-project.org",
          tokenStore,
          autoFetchUser: false,
          onTokenChange,
          onUserChange,
        }}
      >
        <TestConsumer />
      </FusioProvider>
    );

    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("token")).toHaveTextContent("test_jwt_123");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
    expect(onTokenChange).toHaveBeenCalledWith("test_jwt_123");
    expect(onUserChange).toHaveBeenCalledWith({ id: 1, name: "Test User" });

    await act(async () => {
      screen.getByTestId("logout-btn").click();
    });

    expect(screen.getByTestId("auth-status")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(onTokenChange).toHaveBeenCalledWith(null);
  });
});
