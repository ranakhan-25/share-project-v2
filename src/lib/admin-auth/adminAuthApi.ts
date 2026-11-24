import type { StoredUser } from "./adminAuthStorage";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const LOGIN_PATH = "/realbizpro/api/v1/share-user/login";

export type LoginSession = {
  accessToken: string;
  refreshToken: string | null;
  user: StoredUser | null;
};

type Json = Record<string, unknown>;

const isObj = (v: unknown): v is Json =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Walks nested `data` wrappers and returns the first object containing a token. */
function findSession(payload: unknown): LoginSession | null {
  let node: unknown = payload;
  for (let depth = 0; depth < 5 && isObj(node); depth++) {
    const access = node.accessToken ?? node.access_token ?? node.token;
    if (typeof access === "string" && access) {
      const refresh = node.refreshToken ?? node.refresh_token;
      return {
        accessToken: access,
        refreshToken: typeof refresh === "string" ? refresh : null,
        user: isObj(node.user) ? (node.user as StoredUser) : null,
      };
    }
    node = node.data;
  }
  return null;
}

/**
 * Login API call.
 *   POST {API_BASE}{LOGIN_PATH}  body: { identifier, email, username, password }
 * Adjust LOGIN_PATH / body fields here if your backend differs.
 */
export async function loginUniversalSession(
  identifier: string,
  password: string,
): Promise<LoginSession> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${LOGIN_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: identifier,
        password,
      }),
    });
    // Fallback to sys-user /auth/login if share-user login rejected or not found
    if (!response.ok) {
      const authRes = await fetch(`${API_BASE}/realbizpro/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: identifier,
          password,
        }),
      });
      if (authRes.ok) {
        response = authRes;
      }
    }
  } catch {
    throw new Error(
      "Cannot reach the server. Please check your connection and try again.",
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isObj(payload) && typeof payload.message === "string"
        ? payload.message
        : `Login failed (${response.status})`;
    throw new Error(message);
  }

  const session = findSession(payload);
  if (!session) throw new Error("Unexpected response from the server.");
  return session;
}

/**
 * Admin Login API call.
 * Specifically validates that the account possesses Admin credentials
 * via Realbiz Pro auth or Share Project admin role.
 */
export async function loginSuperAdminSession(
  identifier: string,
  password: string,
): Promise<LoginSession> {
  const cleanId = identifier.trim();
  let session: LoginSession | null = null;
  let lastErrorMessage = "";

  // 1. Try realbiz_pro system auth (/auth/login)
  try {
    const authRes = await fetch(`${API_BASE}/realbizpro/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: cleanId,
        password,
      }),
    });

    const payload = await authRes.json().catch(() => null);
    if (authRes.ok) {
      const parsedSession = findSession(payload);
      if (parsedSession) {
        const u = parsedSession.user as Record<string, unknown> | null;
        const isSuper =
          Boolean(u?.isSuperUser) ||
          Boolean(u?.isOrgAdmin) ||
          (Array.isArray(u?.roles) &&
            (u.roles as string[]).some((r) =>
              ["super-admin", "super_admin", "admin"].includes(
                String(r).toLowerCase(),
              ),
            ));

        if (isSuper) {
          session = parsedSession;
        } else {
          lastErrorMessage =
            "Access denied: This account is not a system Administrator.";
        }
      }
    } else if (isObj(payload) && typeof payload.message === "string") {
      lastErrorMessage = payload.message;
    }
  } catch (e) {
    // Network or parse issue, fallback to share-user check
  }

  // 2. If not matched, try share-user login (/share-user/login)
  if (!session) {
    try {
      const shareRes = await fetch(`${API_BASE}${LOGIN_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: cleanId,
          password,
        }),
      });

      const payload = await shareRes.json().catch(() => null);
      if (shareRes.ok) {
        const parsedSession = findSession(payload);
        if (parsedSession) {
          const u = parsedSession.user as Record<string, unknown> | null;
          if (u?.role === "super-admin" || u?.role === "admin") {
            session = parsedSession;
          } else {
            throw new Error(
              "Access denied: This account is not a Share Project Admin.",
            );
          }
        }
      } else if (!lastErrorMessage && isObj(payload) && typeof payload.message === "string") {
        lastErrorMessage = payload.message;
      }
    } catch (err: any) {
      if (err.message && err.message.startsWith("Access denied")) {
        throw err;
      }
    }
  }

  if (!session) {
    throw new Error(
      lastErrorMessage ||
        "Login failed. Please verify your Admin credentials and try again.",
    );
  }

  return session;
}

/**
 * Admin Register API call.
 * Registers a new Admin in Share Project and syncs with Realbiz Pro.
 */
export async function registerSuperAdminSession(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<LoginSession> {
  const response = await fetch(
    `${API_BASE}/realbizpro/api/v1/share-user/super-admin/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      isObj(payload) && typeof payload.message === "string"
        ? payload.message
        : `Registration failed (${response.status})`;
    throw new Error(message);
  }

  const session = findSession(payload);
  if (!session) {
    throw new Error("Admin registered, but session could not be established. Please log in.");
  }
  return session;
}
