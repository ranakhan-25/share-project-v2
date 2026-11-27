import api from "@/lib/api";

const ROOT = "/realbizpro/api/v1/share-project";

export type ShareApiProject = {
  uuid: string;
  code?: string;
  name: string;
  description: string;
  location?: string;
  thumbnailUrl?: string;
  totalInvestmentAmount: number | string;
  totalShares: number;
  pricePerShare: number | string;
  minimumInvestment: number | string;
  expectedAnnualReturn?: number | string;
  startDate?: string;
  endDate?: string;
  status: string;
  rejectionReason?: string | null;
  categoryId: number;
  category?: { id: number; name: string };
  images?: { url: string }[];
  documents?: { title?: string; url: string }[];
  submissions?: { type?: string; createdAt?: string; submittedAt?: string }[];
  statusHistory?: { toStatus?: string; note?: string; createdAt?: string }[];
};

function unwrap<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return payload as T;
  const root = payload as Record<string, unknown>;
  return ("data" in root ? root.data : root) as T;
}

// Fast In-Memory Client Cache & In-Flight Request Deduplication
const clientApiCache = new Map<string, { data: any; expiry: number }>();
const inflightRequests = new Map<string, Promise<any>>();

async function cachedGet<T>(path: string, ttlMs = 20000): Promise<T> {
  const now = Date.now();
  const cached = clientApiCache.get(path);
  if (cached && cached.expiry > now) {
    return cached.data as T;
  }
  const inflight = inflightRequests.get(path);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const promise = (async () => {
    try {
      const response = await api.get(path);
      const data = unwrap<T>(response.data);
      clientApiCache.set(path, { data, expiry: Date.now() + ttlMs });
      return data;
    } finally {
      inflightRequests.delete(path);
    }
  })();

  inflightRequests.set(path, promise);
  return promise;
}

export function clearClientProjectCache() {
  clientApiCache.clear();
}

export async function getPublicProjects(page = 1, limit = 100) {
  return cachedGet<{ data: ShareApiProject[]; meta?: { total: number; page: number; limit: number; totalPages?: number } }>(
    `${ROOT}/public/projects?page=${page}&limit=${limit}`,
    20000,
  );
}

export async function getPublicProject(uuid: string) {
  return cachedGet<ShareApiProject>(
    `${ROOT}/public/projects/${encodeURIComponent(uuid)}`,
    30000,
  );
}

export async function getOwnerProjects(status?: string, page = 1, limit = 100) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) query.set("status", status);
  const response = await api.get(`${ROOT}/owner/projects?${query.toString()}`);
  return unwrap<{ data: ShareApiProject[]; meta?: { total: number; page: number; limit: number } }>(response.data);
}

export async function getOwnerProject(uuid: string) {
  const response = await api.get(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}`);
  return unwrap<ShareApiProject>(response.data);
}

export async function getPublicCategories() {
  return cachedGet<Array<{ id: number; uuid: string; code: string; name: string }>>(
    `${ROOT}/public/categories`,
    60000,
  );
}

export async function createOwnerProject(dto: Record<string, unknown>) {
  clearClientProjectCache();
  const response = await api.post(`${ROOT}/owner/projects`, dto);
  return unwrap<ShareApiProject>(response.data);
}

export async function updateOwnerProject(uuid: string, dto: Record<string, unknown>) {
  clearClientProjectCache();
  const response = await api.put(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}`, dto);
  return unwrap<ShareApiProject>(response.data);
}

export async function submitOwnerProject(uuid: string) {
  clearClientProjectCache();
  const response = await api.post(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/submit`);
  return unwrap<ShareApiProject>(response.data);
}

export async function resubmitOwnerProject(uuid: string) {
  clearClientProjectCache();
  const response = await api.post(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/resubmit`);
  return unwrap<ShareApiProject>(response.data);
}

export async function getOwnerSubmissionHistory(uuid: string) {
  const response = await api.get(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/submissions`);
  return unwrap<unknown[]>(response.data);
}

export async function requestPublishOwnerProject(uuid: string) {
  clearClientProjectCache();
  const response = await api.post(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/publish-request`, {});
  return unwrap<Record<string, unknown>>(response.data);
}

export async function unpublishOwnerProject(uuid: string) {
  clearClientProjectCache();
  const response = await api.post(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/unpublish`, {});
  return unwrap<Record<string, unknown>>(response.data);
}

export async function deleteOwnerProject(uuid: string) {
  clearClientProjectCache();
  const response = await api.delete(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}`);
  return unwrap<{ success?: boolean; message?: string }>(response.data);
}

export async function getOwnerProjectInvestors(uuid: string) {
  const response = await api.get(`${ROOT}/owner/projects/${encodeURIComponent(uuid)}/investors`);
  return unwrap<Array<{
    id?: number | string;
    uuid?: string;
    code?: string;
    investorName?: string;
    investorEmail?: string;
    investorPhone?: string;
    quantity?: number;
    totalAmount?: number | string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  }>>(response.data);
}

export async function getShareUserProfile() {
  const response = await api.get("/realbizpro/api/v1/share-user/profile");
  return unwrap<Record<string, unknown>>(response.data);
}

export async function updateShareUserProfile(dto: { name?: string; phone?: string }) {
  const response = await api.patch("/realbizpro/api/v1/share-user/profile", dto);
  return unwrap<Record<string, unknown>>(response.data);
}

export async function logoutShareUser() {
  await api.post("/realbizpro/api/v1/share-user/logout", {});
}

export type ShareDashboardMonthlyPoint = {
  year: number;
  monthIndex: number;
  shareValue: number;
  collected: number;
  monthlyCollected: number;
  monthlyTarget: number;
  projectCount: number;
  pendingCount: number;
  rejectedCount: number;
};

export type ShareUserDashboardData = {
  counts?: Record<string, number>;
  totalProjects?: number;
  totalShareValue?: number;
  totalCollected?: number;
  totalShares?: number;
  soldShares?: number;
  remainingShares?: number;
  growth?: {
    shareValueDeltaPct?: number;
    projectDeltaPct?: number;
    pendingDeltaPct?: number;
    rejectedDeltaPct?: number;
  };
  monthlySeries?: ShareDashboardMonthlyPoint[];
  allocation?: Array<{ name: string; value: number }>;
  topProjects?: Array<{ uuid?: string; name: string; soldShares: number; totalShares: number; soldPercent: number; value?: number }>;
  recentTransactions?: Array<{
    uuid: string;
    code?: string | null;
    shareholderName: string;
    projectUuid?: string;
    projectName: string;
    quantity?: number;
    amount: number;
    status: "paid" | "pending" | "overdue";
    rawStatus?: string;
    createdAt: string;
  }>;
  leaderboard?: Array<{ name: string; pts: number; totalAmount?: number; shares?: number; count?: number }>;
  recentProjects?: Array<Record<string, unknown>>;
};

export async function getShareProjectUserDashboard() {
  const response = await api.get(`${ROOT}/user/dashboard`);
  return unwrap<ShareUserDashboardData>(response.data);
}

export async function getShareProjectPortfolio() {
  const response = await api.get(`${ROOT}/user/portfolio`);
  return unwrap<Record<string, unknown[]>>(response.data);
}

export async function getPublicPortfolio(params?: { email?: string; phone?: string; code?: string }) {
  const query = new URLSearchParams();
  if (params?.email) query.set("email", params.email);
  if (params?.phone) query.set("phone", params.phone);
  if (params?.code) query.set("code", params.code);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await api.get(`${ROOT}/public/portfolio${qs}`);
  return unwrap<Record<string, unknown[]>>(response.data);
}

export async function getShareProjectNotifications() {
  const response = await api.get(`${ROOT}/user/notifications`);
  return unwrap<Array<Record<string, unknown>>>(response.data);
}

export async function prepareShareProjectInvestment(projectUuid: string, quantity: number) {
  const response = await api.post(`${ROOT}/user/investments/prepare`, { projectUuid, quantity });
  return unwrap<Record<string, unknown>>(response.data);
}

export async function createPublicShareProject(dto: Record<string, unknown>) {
  const response = await api.post(`${ROOT}/public/projects`, dto);
  return unwrap<ShareApiProject>(response.data);
}

export async function requestPublicInvestment(dto: {
  projectUuid: string;
  name: string;
  email: string;
  password?: string;
  investorType?: string;
  organizationName?: string;
  organizationLocation?: string;
  organizationPhone?: string;
  representativePhone?: string;
  tradeLicenseNumber?: string;
  organizationRepresentativeName?: string;
  organizationDesignation?: string;
  phone: string;
  quantity: number;
}) {
  const response = await api.post(`${ROOT}/public/investments/request`, dto);
  return unwrap<Record<string, unknown>>(response.data);
}

export type LocationDistrict = {
  id: number;
  divisionId: number;
  divisionName: string;
  divisionBnName: string;
  name: string;
  bnName: string;
};

export type LocationDivision = {
  id: number;
  name: string;
  bnName: string;
  code: string;
  districts: LocationDistrict[];
};

export type LocationsResponse = {
  totalDivisions: number;
  totalDistricts: number;
  divisions: LocationDivision[];
  districts?: LocationDistrict[];
  locations?: Array<{
    id: number;
    district: string;
    districtBn: string;
    division: string;
    divisionBn: string;
    label: string;
    labelBn: string;
  }>;
};

export async function getPublicLocations(search?: string): Promise<LocationsResponse> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  try {
    const response = await api.get(`/realbizpro/api/v1/locations${query}`);
    return unwrap<LocationsResponse>(response.data);
  } catch {
    const fallbackResponse = await api.get(`${ROOT}/public/locations${query}`);
    return unwrap<LocationsResponse>(fallbackResponse.data);
  }
}

export async function getPublicDistricts(division?: string, search?: string): Promise<LocationDistrict[]> {
  const params = new URLSearchParams();
  if (division) params.set("division", division);
  if (search) params.set("search", search);
  const q = params.toString() ? `?${params.toString()}` : "";
  try {
    const response = await api.get(`/realbizpro/api/v1/locations/districts${q}`);
    const data = unwrap<any>(response.data);
    return Array.isArray(data) ? data : data?.districts || [];
  } catch {
    const fallback = await api.get(`${ROOT}/public/locations${q}`);
    const data = unwrap<any>(fallback.data);
    return data?.districts || [];
  }
}

/* ==================== WISHLIST APIS ==================== */

export async function getWishlistUuids(): Promise<string[]> {
  try {
    const res = await api.get('/realbizpro/api/v1/share-user/wishlist');
    const data = res.data?.data || res.data;
    if (Array.isArray(data?.projectUuids)) return data.projectUuids;
    if (Array.isArray(data)) return data.map((item: any) => typeof item === 'string' ? item : item.project_uuid || item.uuid);
    return [];
  } catch {
    try {
      const local = localStorage.getItem('share-project:wishlist');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }
}

export async function toggleWishlistApi(uuid: string): Promise<{ wishlisted: boolean }> {
  try {
    const res = await api.post(`/realbizpro/api/v1/share-user/wishlist/toggle/${encodeURIComponent(uuid)}`);
    const data = res.data?.data || res.data;
    const wishlisted = Boolean(data?.wishlisted);
    // sync with localStorage
    try {
      const current = new Set<string>(JSON.parse(localStorage.getItem('share-project:wishlist') || '[]'));
      if (wishlisted) current.add(uuid); else current.delete(uuid);
      localStorage.setItem('share-project:wishlist', JSON.stringify(Array.from(current)));
    } catch {}
    return { wishlisted };
  } catch {
    // fallback to local toggle if API fails
    try {
      const current = new Set<string>(JSON.parse(localStorage.getItem('share-project:wishlist') || '[]'));
      const next = !current.has(uuid);
      if (next) current.add(uuid); else current.delete(uuid);
      localStorage.setItem('share-project:wishlist', JSON.stringify(Array.from(current)));
      return { wishlisted: next };
    } catch {
      return { wishlisted: false };
    }
  }
}

/* ==================== PROJECT COMPARE APIS ==================== */

export async function getCompareListApi(): Promise<any[]> {
  try {
    const res = await api.get('/realbizpro/api/v1/share-project/compare');
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      try {
        localStorage.setItem('share-project:compare-list', JSON.stringify(data));
      } catch {}
      return data;
    }
    return [];
  } catch {
    try {
      const local = localStorage.getItem('share-project:compare-list');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }
}

export async function toggleCompareApi(projectUuid: string): Promise<{ action: 'added' | 'removed'; list: any[] }> {
  try {
    const res = await api.post('/realbizpro/api/v1/share-project/compare/toggle', { projectUuid });
    const data = res.data?.data || res.data;
    const list = Array.isArray(data?.list) ? data.list : [];
    try {
      localStorage.setItem('share-project:compare-list', JSON.stringify(list));
    } catch {}
    return { action: data?.action || 'added', list };
  } catch (err: any) {
    if (err?.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw err;
  }
}

export async function removeCompareApi(projectUuid: string): Promise<any[]> {
  try {
    const res = await api.delete(`/realbizpro/api/v1/share-project/compare/${encodeURIComponent(projectUuid)}`);
    const data = res.data?.data || res.data;
    const list = Array.isArray(data?.list) ? data.list : [];
    try {
      localStorage.setItem('share-project:compare-list', JSON.stringify(list));
    } catch {}
    return list;
  } catch {
    return [];
  }
}

export async function clearCompareApi(): Promise<void> {
  try {
    await api.delete('/realbizpro/api/v1/share-project/compare');
    try {
      localStorage.removeItem('share-project:compare-list');
    } catch {}
  } catch {
    try {
      localStorage.removeItem('share-project:compare-list');
    } catch {}
  }
}

/* ==================== VIEW LOGS, FAVORITES & OWNER LEADS ==================== */

export interface ProjectViewGroup {
  key: string;
  projectUuid: string;
  projectName: string;
  projectCode: string;
  projectLocation: string;
  allowOwnerLeadView: boolean;
  viewerId: number | null;
  viewerName: string;
  viewerEmail: string;
  viewerPhone: string;
  visitorKey: string;
  viewCount: number;
  isFavorited: boolean;
  firstViewedAt: string;
  lastViewedAt: string;
  timestamps: { viewedAt: string; ipAddress: string | null }[];
}

export interface ProjectFavoriteRecord {
  uuid: string;
  projectUuid?: string;
  projectName?: string;
  projectCode?: string;
  projectLocation?: string;
  allowOwnerLeadView?: boolean;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  favoritedAt: string;
}

export async function recordPublicProjectView(
  projectUuid: string,
  payload: {
    viewerId?: number;
    visitorKey?: string;
    viewerName?: string;
    viewerEmail?: string;
    viewerPhone?: string;
  },
) {
  try {
    const res = await api.post(
      `${ROOT}/public/projects/${encodeURIComponent(projectUuid)}/view`,
      payload,
    );
    return unwrap<{ recorded: boolean; viewedAt: string }>(res.data);
  } catch {
    return { recorded: false, viewedAt: "" };
  }
}

export async function toggleProjectFavoriteApi(projectUuid: string): Promise<{ favorited: boolean }> {
  const res = await api.post(`${ROOT}/favorites/toggle`, { projectUuid });
  const data = unwrap<{ favorited: boolean }>(res.data);
  return { favorited: Boolean(data?.favorited) };
}

export async function getProjectFavoriteStatusApi(projectUuid: string): Promise<boolean> {
  try {
    const res = await api.get(`${ROOT}/favorites/status/${encodeURIComponent(projectUuid)}`);
    const data = unwrap<{ favorited: boolean }>(res.data);
    return Boolean(data?.favorited);
  } catch {
    return false;
  }
}

export async function getOwnerProjectInterestedLeads(projectUuid: string) {
  const res = await api.get(`${ROOT}/user/projects/${encodeURIComponent(projectUuid)}/interested-leads`);
  return unwrap<{
    permitted: boolean;
    views: ProjectViewGroup[];
    favorites: ProjectFavoriteRecord[];
  }>(res.data);
}


