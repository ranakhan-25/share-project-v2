"use client";

const API_BASE = (
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : "http://localhost:5002"
).replace(/\/+$/, "");

export type ShareProjectStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "published"
  | "unpublished";

export type ShareProjectRecord = {
  id?: string | number;
  uuid?: string;
  code?: string;
  name?: string;
  projectType?: string;
  location?: string;
  description?: string;
  totalBudget?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdAt?: string;
  owner?: unknown;
  creatorName?: string;
  creatorEmail?: string;
  creatorPhone?: string;
  companyName?: string;
  totalInvestmentAmount?: number | string;
  pricePerShare?: number | string;
  totalShares?: number;
  minimumInvestment?: number | string;
  expectedAnnualReturn?: number | string;
  thumbnailUrl?: string;
  category?: { id?: number; name?: string } | null;
  images?: Array<{ url: string; caption?: string }>;
  documents?: Array<{ url: string; title?: string }>;
  submissions?: Array<{ type?: string; createdAt?: string; submittedAt?: string }>;
  statusHistory?: Array<{ toStatus?: string; note?: string; createdAt?: string; createdBy?: string }>;
  [key: string]: unknown;
};

export type ShareUserRecord = {
  id?: string | number;
  uuid?: string;
  code?: string;
  name?: string;
  mobileNo?: string;
  phone?: string;
  email?: string;
  nid?: string;
  role?: string;
  address?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type ProjectCategoryRecord = {
  id?: string | number;
  uuid?: string;
  code?: string;
  name?: string;
  isActive?: boolean;
  createdAt?: string;
  [key: string]: unknown;
};

export type InvestmentRecord = {
  id?: string | number;
  uuid?: string;
  projectUuid?: string;
  investorName?: string;
  investorEmail?: string;
  investorPhone?: string;
  shareQuantity?: number;
  totalAmount?: number | string;
  paymentMethod?: string;
  transactionId?: string;
  status?: string;
  rejectionReason?: string;
  project?: { name?: string; code?: string };
  createdAt?: string;
  [key: string]: unknown;
};

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("admin_access_token") ||
    localStorage.getItem("share_project_access_token") ||
    localStorage.getItem("share-project:access-token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function unwrap<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const body = payload as Record<string, unknown>;
  if (Array.isArray(body.data)) return body.data as T[];
  if (body.data && typeof body.data === "object") {
    const nested = body.data as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data as T[];
  }
  return [];
}

async function request<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; params?: Record<string, unknown> } = {},
): Promise<T> {
  let url = path.startsWith("http")
    ? path
    : `${API_BASE}/realbizpro/api/v1${path.startsWith("/") ? "" : "/"}${path}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: getAuthHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;

  if (!res.ok) {
    const errorMsg =
      (data && typeof data.message === "string" ? data.message : null) ||
      (data && Array.isArray(data.message) ? data.message.join(", ") : null) ||
      (data && typeof data.error === "string" ? data.error : null) ||
      `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return (data as unknown) as T;
}

/* ==================== AUTH FUNCTIONS ==================== */

export async function loginSuperAdminSession(identifier: string, password: string) {
  let response: Response | null = null;
  let payload: any = null;

  // 1. Try realbiz_pro system login endpoint with username/identifier
  try {
    const res = await fetch(`${API_BASE}/realbizpro/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username: identifier.trim(), password }),
    });
    if (res.ok) {
      response = res;
      payload = await res.json().catch(() => null);
    }
  } catch {}

  // 2. If sys-user auth didn't succeed, fallback to share-user login
  if (!response || !response.ok) {
    try {
      const shareRes = await fetch(`${API_BASE}/realbizpro/api/v1/share-user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });
      if (shareRes.ok) {
        response = shareRes;
        payload = await shareRes.json().catch(() => null);
      } else {
        const errPayload = await shareRes.json().catch(() => null);
        throw new Error(
          (errPayload && typeof errPayload.message === "string" ? errPayload.message : null) ||
            "Invalid credentials. Please verify your email/username and password."
        );
      }
    } catch (e: any) {
      throw new Error(e.message || "Failed to connect to authentication service.");
    }
  }

  const access = payload?.accessToken || payload?.data?.accessToken || payload?.token;
  const refresh = payload?.refreshToken || payload?.data?.refreshToken;
  const user = payload?.user || payload?.data?.user;

  if (!access) {
    throw new Error("Login failed: Authentication token was not returned by server.");
  }

  // Validate Super Admin privileges
  const isSuperUser = Boolean(user?.isSuperUser);
  const isSuperAdminRole =
    user?.role === "super-admin" ||
    (Array.isArray(user?.roles) &&
      user.roles.some((r: string) => ["super-admin", "super_admin", "admin"].includes(r.toLowerCase())));

  if (!isSuperUser && !isSuperAdminRole) {
    throw new Error(
      "অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে: এই পোর্টালে শুধুমাত্র অ্যাডমিনদের প্রবেশের অনুমতি রয়েছে। (Access denied: Admin only.)"
    );
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("admin_access_token", access);
    localStorage.setItem("share_project_access_token", access);
    localStorage.setItem("share-project:access-token", access);
    localStorage.setItem("token", access);
    localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("share-project:refresh-token", refresh);
    if (user) localStorage.setItem("share-project:user", JSON.stringify(user));
  }

  return { accessToken: access, refreshToken: refresh, user };
}

export async function registerSuperAdminSession(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/share-user/super-admin/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });

  const payload: any = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg =
      (payload && typeof payload.message === "string" ? payload.message : null) ||
      (payload && Array.isArray(payload.message) ? payload.message.join(", ") : null) ||
      "Failed to register Admin.";
    throw new Error(errorMsg);
  }

  const access = payload?.accessToken || payload?.data?.accessToken;
  const refresh = payload?.refreshToken || payload?.data?.refreshToken;
  const user = payload?.user || payload?.data?.user;

  if (access && typeof window !== "undefined") {
    localStorage.setItem("admin_access_token", access);
    localStorage.setItem("share_project_access_token", access);
    localStorage.setItem("share-project:access-token", access);
    localStorage.setItem("token", access);
    localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("share-project:refresh-token", refresh);
    if (user) localStorage.setItem("share-project:user", JSON.stringify(user));
  }

  return { accessToken: access, refreshToken: refresh, user };
}

/* ==================== PROJECT MANAGEMENT ==================== */

export async function getProjects(
  params: { status?: string; search?: string; page?: number; limit?: number; trash?: boolean } = {}
) {
  const page = params.page || 1;
  const limit = params.limit || 100;
  const status = params.status?.toLowerCase();
  const routes: Record<string, string> = {
    pending: "/share-project/admin/projects/pending",
    approved: "/share-project/admin/projects/approved",
    rejected: "/share-project/admin/projects/rejected",
    published: "/share-project/admin/projects/published",
    unpublished: "/share-project/admin/projects/unpublished",
  };
  const url = params.trash
    ? "/share-project/admin/projects/trash"
    : routes[status || ""] || "/share-project/admin/projects";

  const res = await request(url, {
    params: {
      page,
      limit,
      ...(status === undefined && params.search ? { search: params.search } : {}),
    },
  });
  return unwrap<ShareProjectRecord>(res);
}

export async function getProject(uuid: string): Promise<ShareProjectRecord> {
  const res: any = await request(`/share-project/admin/projects/${encodeURIComponent(uuid)}`);
  return (res?.data || res) as ShareProjectRecord;
}

export async function approveProject(uuid: string) {
  return request(`/share-project/admin/projects/${encodeURIComponent(uuid)}/approve`, {
    method: "POST",
  });
}

export async function rejectProject(uuid: string, reason: string) {
  return request(`/share-project/admin/projects/${encodeURIComponent(uuid)}/reject`, {
    method: "POST",
    body: { reason },
  });
}

export async function publishProject(uuid: string) {
  return request(`/share-project/admin/projects/${encodeURIComponent(uuid)}/publish`, {
    method: "POST",
  });
}

export async function unpublishProject(uuid: string) {
  return request(`/share-project/admin/projects/${encodeURIComponent(uuid)}/unpublish`, {
    method: "POST",
  });
}

export async function softDeleteProject(uuid: string) {
  return request(`/share-project/admin/projects/${encodeURIComponent(uuid)}`, {
    method: "DELETE",
  });
}

export async function restoreProject(uuid: string) {
  return request(`/share-project/admin/projects/${encodeURIComponent(uuid)}/restore`, {
    method: "PATCH",
  });
}

/* ==================== CATEGORIES MANAGEMENT ==================== */

export async function getCategories() {
  const res = await request("/share-project/admin/categories");
  return unwrap<ProjectCategoryRecord>(res);
}

export async function createCategory(data: { code: string; name: string; isActive?: boolean }) {
  return request("/share-project/admin/categories", {
    method: "POST",
    body: data,
  });
}

export async function updateCategory(uuid: string, data: { code?: string; name?: string; isActive?: boolean }) {
  return request(`/share-project/admin/categories/${encodeURIComponent(uuid)}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteCategory(uuid: string) {
  return request(`/share-project/admin/categories/${encodeURIComponent(uuid)}`, {
    method: "DELETE",
  });
}

/* ==================== SHARE USERS MANAGEMENT ==================== */

export async function getShareUsers(params = {}) {
  const res = await request("/share-user", { params: { page: 1, limit: 100, ...params } });
  return unwrap<ShareUserRecord>(res);
}

export async function createShareUser(data: Record<string, unknown>) {
  return request("/share-user/admin/create", {
    method: "POST",
    body: data,
  });
}

export async function updateShareUser(uuid: string, data: { name?: string; phone?: string; password?: string }) {
  return request(`/share-user/${encodeURIComponent(uuid)}/admin-update`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteShareUser(uuid: string) {
  return request(`/share-user/${encodeURIComponent(uuid)}`, {
    method: "DELETE",
  });
}

export async function restoreShareUser(uuid: string) {
  return request(`/share-user/${encodeURIComponent(uuid)}/restore`, {
    method: "POST",
  });
}

export async function blockShareUser(uuid: string) {
  return request(`/share-user/${encodeURIComponent(uuid)}/block`, {
    method: "PATCH",
  });
}

export async function unblockShareUser(uuid: string) {
  return request(`/share-user/${encodeURIComponent(uuid)}/unblock`, {
    method: "PATCH",
  });
}

/* ==================== INVESTMENTS MANAGEMENT ==================== */

export async function getInvestments(
  params: { projectUuid?: string; page?: number; limit?: number; trash?: boolean } = {}
) {
  const res = await request("/share-project/admin/investments", {
    params: {
      page: params.page || 1,
      limit: params.limit || 100,
      ...(params.projectUuid ? { projectUuid: params.projectUuid } : {}),
      ...(params.trash ? { trash: "true" } : {}),
    },
  });
  return unwrap<InvestmentRecord>(res);
}

export async function approveInvestment(uuid: string) {
  return request(`/share-project/admin/investments/${encodeURIComponent(uuid)}/approve`, {
    method: "POST",
  });
}

export async function rejectInvestment(uuid: string, reason: string) {
  return request(`/share-project/admin/investments/${encodeURIComponent(uuid)}/reject`, {
    method: "POST",
    body: { reason },
  });
}

export async function softDeleteInvestment(uuid: string) {
  return request(`/share-project/admin/investments/${encodeURIComponent(uuid)}`, {
    method: "DELETE",
  });
}

export async function restoreInvestment(uuid: string) {
  return request(`/share-project/admin/investments/${encodeURIComponent(uuid)}/restore`, {
    method: "PATCH",
  });
}
