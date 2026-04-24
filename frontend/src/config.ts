/**
 * Configuration module for API endpoints
 * Supports switching between mock and production APIs
 */

interface ApiConfig {
  productionUrl: string;
  mockUrl: string;
  mode: "production" | "mock";
}

const config: ApiConfig = {
  productionUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
  mockUrl: import.meta.env.VITE_MOCK_API_URL || "http://localhost:5000",
  mode: (import.meta.env.VITE_API_MODE || "production") as
    | "production"
    | "mock",
};

/**
 * Get the appropriate API URL based on environment configuration
 * @returns The base URL for API calls
 */
export function getApiUrl(): string {
  if (config.mode === "mock") {
    return config.mockUrl;
  }
  return config.productionUrl;
}

/**
 * Get current API mode (useful for debugging/logging)
 * @returns Current API mode: 'production' or 'mock'
 */
export function getApiMode(): string {
  return config.mode;
}

/**
 * Get the full config object
 */
export function getConfig(): ApiConfig {
  return config;
}

export default config;
