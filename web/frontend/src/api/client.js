const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("nohayo_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("nohayo_token", token);
  else localStorage.removeItem("nohayo_token");
}

/** An API failure. `code` is the server's machine-readable reason (e.g.
 *  "boiler_offline", "dolphin_relink"), or "network" when the server couldn't be reached. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let onSessionExpired = () => {};
/** AppContext registers this to sign out when the NOHAYO token is rejected. */
export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw new ApiError(
      offline ? "You're offline. Check your internet connection." : "Can't reach NOHAYO right now. Try again in a moment.",
      { code: "network" },
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Only a token we sent can expire; a 401 from the login form is just a wrong password.
    if (res.status === 401 && token) {
      setToken(null);
      onSessionExpired();
      throw new ApiError("Your session has ended. Please sign in again.", { status: 401, code: "session_expired" });
    }
    throw new ApiError(data.error || `Request failed (${res.status})`, { status: res.status, code: data.code || "" });
  }
  return data;
}

export const api = {
  signup: (email, password, name) => request("/auth/signup", { method: "POST", body: { email, password, name } }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),

  listChildren: () => request("/children"),
  createChild: (payload) => request("/children", { method: "POST", body: payload }),
  getChild: (childId) => request(`/children/${childId}`),

  listMoments: (childId) => request(`/children/${childId}/moments`),
  createMoment: (childId, payload) => request(`/children/${childId}/moments`, { method: "POST", body: payload }),

  listInsights: (childId) => request(`/children/${childId}/insights`),
  getInsight: (childId, insightId) => request(`/children/${childId}/insights/${insightId}`),
  setInsightStatus: (childId, insightId, status) =>
    request(`/children/${childId}/insights/${insightId}/status`, { method: "POST", body: { status } }),

  listGoals: (childId) => request(`/children/${childId}/goals`),
  createGoal: (childId, payload) => request(`/children/${childId}/goals`, { method: "POST", body: payload }),
  noticeGoal: (childId, goalId) => request(`/children/${childId}/goals/${goalId}/notice`, { method: "POST" }),

  listJournal: (childId) => request(`/children/${childId}/journal`),
  createJournalEntry: (childId, payload) => request(`/children/${childId}/journal`, { method: "POST", body: payload }),

  listFamily: (childId) => request(`/children/${childId}/family`),
  inviteFamilyMember: (childId, payload) => request(`/children/${childId}/family`, { method: "POST", body: payload }),

  // Dolphin boiler controls (backend proxies to the Dolphin cloud; the API key never reaches the browser,
  // and the Dolphin password is sent once, to /boiler/link, and never kept here)
  getBoiler: () => request("/boiler"),
  linkBoiler: (email, password) => request("/boiler/link", { method: "POST", body: { email, password } }),
  unlinkBoiler: () => request("/boiler/link", { method: "DELETE" }),
  boilerHeat: (device, temperature) => request(`${boilerDevice(device)}/heat`, { method: "POST", body: { temperature } }),
  boilerOff: (device) => request(`${boilerDevice(device)}/off`, { method: "POST" }),
  boilerShowers: (device, count) => request(`${boilerDevice(device)}/showers`, { method: "POST", body: { count } }),
  boilerFixed: (device, temperature) =>
    temperature === null
      ? request(`${boilerDevice(device)}/fixed`, { method: "DELETE" })
      : request(`${boilerDevice(device)}/fixed`, { method: "POST", body: { temperature } }),
  boilerShabbat: (device, on) => request(`${boilerDevice(device)}/shabbat`, { method: "POST", body: { on } }),
};

function boilerDevice(device) {
  return `/boiler/devices/${encodeURIComponent(device)}`;
}
