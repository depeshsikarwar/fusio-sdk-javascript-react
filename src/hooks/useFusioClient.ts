import { useMemo } from "react";
import { useFusio } from "../context/FusioContext";
import type { Client } from "fusio-sdk";
import type { CredentialsInterface } from "sdkgen-client";

/**
 * Hook to access Fusio clients (authenticated, anonymous, or custom generated SDKs).
 */
export function useFusioClient() {
  const { client, anonymousClient, createClient, token, config } = useFusio();

  return {
    client,
    anonymousClient,
    createClient,
    token,
    baseUrl: config.baseUrl,
  };
}

/**
 * Hook to instantiate and memoize a custom type-safe client generated from Fusio backend or CLI.
 *
 * @example
 * ```tsx
 * const myApiClient = useCustomClient((baseUrl, credentials) => new AppClient(baseUrl, credentials));
 * ```
 */
export function useCustomClient<T extends Client = Client>(
  factory: (baseUrl: string, credentials?: CredentialsInterface | null) => T
): T {
  const { createClient, token } = useFusio();

  // Re-instantiate if token or factory changes
  return useMemo(() => {
    return createClient(factory);
  }, [createClient, factory, token]);
}
