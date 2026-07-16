import type { AuthProvider } from "@refinedev/core";
import { AUTH_API_URL, TOKEN_KEY, USER_KEY } from "./constants";

interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    createdAt?: string;
  };
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      (body as { message?: string }).message ?? `Request failed with status ${response.status}`,
    );
  }
  return body as T;
}

function persistSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const authProvider: AuthProvider = {
  login: async ({ email, username, password }) => {
    try {
      const auth = await request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email ?? username, password }),
      });
      persistSession(auth);
      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: error instanceof Error ? error.message : "Login failed",
        },
      };
    }
  },
  register: async ({ email, password, username }) => {
    try {
      const auth = await request<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, username }),
      });
      persistSession(auth);
      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "RegisterError",
          message: error instanceof Error ? error.message : "Registration failed",
        },
      };
    }
  },
  logout: async () => {
    clearSession();
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }

    try {
      const user = await request<AuthResponse["user"]>("/api/auth/me");
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { authenticated: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }
      // Network/server errors: keep the local session so a flaky backend
      // doesn't log users out; the next successful check revalidates.
      return { authenticated: true };
    }
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const cached = localStorage.getItem(USER_KEY);
    if (cached) {
      return JSON.parse(cached) as AuthResponse["user"];
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }
    const user = await request<AuthResponse["user"]>("/api/auth/me");
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },
  onError: async (error) => {
    if (error?.status === 401) {
      clearSession();
      return { error, logout: true, redirectTo: "/login" };
    }
    console.error(error);
    return { error };
  },
};
