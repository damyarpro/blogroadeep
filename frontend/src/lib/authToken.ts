// Where the panel's auth token lives. Kept in its own module (no React, no JSX)
// so `api.ts` can read the token without importing the auth context.

const TOKEN_KEY = 'panel_token';

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable — the session just won't survive a refresh.
  }
}
