import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FusioProvider, Activate, ChangePassword } from "../src";
import { MemoryTokenStore } from "sdkgen-client";

describe("Activate component", () => {
  it("renders activation token input when not auto-activated", () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <Activate autoActivate={false} />
      </FusioProvider>
    );

    expect(screen.getByLabelText(/activation token/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /activate account/i })).toBeInTheDocument();
  });
});

describe("ChangePassword component", () => {
  it("renders current, new, and verify password inputs", () => {
    const tokenStore = new MemoryTokenStore();
    render(
      <FusioProvider config={{ baseUrl: "https://api.fusio-project.org", tokenStore, autoFetchUser: false }}>
        <ChangePassword />
      </FusioProvider>
    );

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });
});
