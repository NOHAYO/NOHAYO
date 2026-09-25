const LABELS = {
  personal_development: "Personal development",
  emotional: "Emotional",
  social: "Social",
  communication: "Communication",
  independence: "Independence",
  learning: "Learning",
  creativity: "Creativity",
  resilience: "Resilience",
};

export function domainLabel(domain) {
  return LABELS[domain] ?? domain;
}

export function domainColor(domain) {
  if (domain === "independence" || domain === "learning") return "var(--green)";
  if (domain === "social" || domain === "communication") return "var(--blue)";
  return "var(--terracotta)";
}

export const DOMAIN_CHIPS = [
  ["__decide__", "Let it decide"],
  ["personal_development", "Personal development"],
  ["emotional", "Emotional"],
  ["social", "Social"],
  ["communication", "Communication"],
  ["creativity", "Creativity"],
  ["independence", "Independence"],
  ["learning", "Learning"],
];
