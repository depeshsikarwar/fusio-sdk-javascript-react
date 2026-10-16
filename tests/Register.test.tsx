import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FusioProvider, Register } from "../src";
import { MemoryTokenStore } from "sdkgen-client";

describe("Register component", () => {
  it("renders registration inputs and submit button", () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <Register />
      </FusioProvider>
    );

    expect(screen.getByLabelText(/full name \/ username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^register$/i })).toBeInTheDocument();
  });

  it("validates password mismatch before submitting", async () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <Register />
      </FusioProvider>
    );

    fireEvent.change(screen.getByLabelText(/full name \/ username/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "alice@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "differentPassword" } });

    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(screen.getByText(/the entered passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("triggers onLoginClick when login link is clicked", () => {
    const tokenStore = new MemoryTokenStore();
    const onLoginClick = vi.fn();

    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <Register onLoginClick={onLoginClick} />
      </FusioProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /already have an account\? sign in/i }));
    expect(onLoginClick).toHaveBeenCalledTimes(1);
  });
});
