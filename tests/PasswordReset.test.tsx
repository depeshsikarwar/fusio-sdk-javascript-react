import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FusioProvider, PasswordReset, PasswordConfirm } from "../src";
import { MemoryTokenStore } from "sdkgen-client";

describe("Password Reset components", () => {
  it("renders PasswordReset email field and submit button", () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <PasswordReset />
      </FusioProvider>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("renders PasswordConfirm fields and validates mismatched password", async () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <PasswordConfirm token="sample_token_xyz" />
      </FusioProvider>
    );

    expect(screen.getByLabelText(/reset token/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reset token/i)).toHaveValue("sample_token_xyz");
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "passA" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "passB" } });

    fireEvent.click(screen.getByRole("button", { name: /^reset password$/i }));

    await waitFor(() => {
      expect(screen.getByText(/the entered passwords do not match/i)).toBeInTheDocument();
    });
  });
});
