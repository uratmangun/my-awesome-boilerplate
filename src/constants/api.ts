/**
 * API Configuration Constants
 * Handles different API URLs for local development and production environments
 */

// Get API URL from environment variable or use fallback
const VITE_DENO_API_URL = import.meta.env.VITE_DENO_API_URL

// Determine if we're in development or production (browser-based detection)
const isDevelopment =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000' ||
    window.location.port === '5173')

// API Base URLs
const API_URLS = {
  development: 'http://localhost:8000',
  production: VITE_DENO_API_URL || 'https://redis-boilerplate.deno.dev', // Use env var or fallback
}

// Get the appropriate base URL
export const API_BASE_URL = isDevelopment
  ? API_URLS.development
  : API_URLS.production

// API Endpoints
export const API_ENDPOINTS = {
  SEARCH_ITEMS: `${API_BASE_URL}/functions/search-items`,
  ADD_ITEM: `${API_BASE_URL}/functions/add-item`,
  GET_ITEM: `${API_BASE_URL}/functions/get-item`,
  DELETE_ITEM: `${API_BASE_URL}/functions/delete-item`,
  LIST_ITEMS_BY_URL: `${API_BASE_URL}/functions/list-items-by-url`,
  INIT_INDEX: `${API_BASE_URL}/functions/init-index`,
} as const

// Helper function to build API URLs with query parameters
export const buildApiUrl = (
  endpoint: string,
  params?: Record<string, string | number>
): string => {
  const url = new URL(endpoint)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  return url.toString()
}

// Export environment info for debugging
export const ENV_INFO = {
  isDevelopment,
  currentBaseUrl: API_BASE_URL,
} as const
