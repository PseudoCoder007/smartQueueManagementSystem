const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function messageFromBody(body: string, fallback: string) {
  if (!body) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(body) as { message?: unknown; error?: unknown; code?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }
    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error;
    }
    if (typeof parsed.code === 'string' && parsed.code.trim()) {
      return parsed.code;
    }
  } catch {
    // Non-JSON responses are still valid error payloads.
  }
  return body;
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, messageFromBody(body, response.statusText));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function jsonBody(data: unknown): RequestInit {
  return { body: JSON.stringify(data) };
}
