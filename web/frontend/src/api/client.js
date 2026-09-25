const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("nohayo_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("nohayo_token", token);
  else localStorage.removeItem("nohayo_token");
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
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
};
