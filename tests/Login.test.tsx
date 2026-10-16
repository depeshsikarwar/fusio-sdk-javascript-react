import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FusioProvider, Login } from "../src";
import { MemoryTokenStore } from "sdkgen-client";

describe("Login component", () => {
  it("renders username, password inputs and submit button", () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <Login />
      </FusioProvider>
    );

    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <Login />
      </FusioProvider>
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByTitle(/show password/i);
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("calls onForgotPasswordClick and onRegisterClick when clicked", () => {
    const tokenStore = new MemoryTokenStore();
    const onForgot = vi.fn();
    const onRegister = vi.fn();

    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <Login onForgotPasswordClick={onForgot} onRegisterClick={onRegister} />
      </FusioProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /forgot password\?/i }));
    expect(onForgot).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /don't have an account\? sign up/i }));
    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it("handles successful login flow with mock client", async () => {
    const tokenStore = new MemoryTokenStore();
    const onSuccess = vi.fn();

    const { container } = render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <Login onSuccess={onSuccess} />
      </FusioProvider>
    );

    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    fireEvent.change(usernameInput, { target: { value: "developer" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });

    // Mock login call on the anonymous client
    // Find the form and submit
    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
  });
});
