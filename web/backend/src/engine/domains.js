/** Port of engine/Domains.java: the development domains a moment can be tagged with (DRD §6). */

export const DOMAINS = {
  PERSONAL_DEVELOPMENT: "personal_development",
  EMOTIONAL: "emotional",
  SOCIAL: "social",
  COMMUNICATION: "communication",
  INDEPENDENCE: "independence",
  LEARNING: "learning",
  CREATIVITY: "creativity",
  RESILIENCE: "resilience",
};

export const MVP_INSIGHT_DOMAINS = [
  DOMAINS.PERSONAL_DEVELOPMENT,
  DOMAINS.LEARNING,
  DOMAINS.INDEPENDENCE,
  DOMAINS.SOCIAL,
];

const LABELS = {
  [DOMAINS.PERSONAL_DEVELOPMENT]: "Personal development",
  [DOMAINS.EMOTIONAL]: "Emotional",
  [DOMAINS.SOCIAL]: "Social",
  [DOMAINS.COMMUNICATION]: "Communication",
  [DOMAINS.INDEPENDENCE]: "Independence",
  [DOMAINS.LEARNING]: "Learning",
  [DOMAINS.CREATIVITY]: "Creativity",
  [DOMAINS.RESILIENCE]: "Resilience",
};

export function label(domain) {
  return LABELS[domain] ?? domain;
}

const KEYWORDS = [
  [DOMAINS.INDEPENDENCE, ["picked", "chose", "herself", "himself", "on her own", "on his own", "dressed", "by myself", "own choice", "decided"]],
  [DOMAINS.SOCIAL, ["friend", "shared", "played with", "grandma", "grandpa", "sibling", "classmate", "hug", "smiled at"]],
  [DOMAINS.COMMUNICATION, ["said", "talked", "asked", "explained", "told us", "words", "sentence"]],
  [DOMAINS.LEARNING, ["learn", "read", "counted", "wrote", "school", "figured out", "practiced", "curious"]],
  [DOMAINS.CREATIVITY, ["drew", "drawing", "painted", "made up", "invented", "song", "story", "imagin"]],
  [DOMAINS.EMOTIONAL, ["cried", "upset", "happy", "excited", "scared", "proud", "frustrated", "calmed"]],
  [DOMAINS.RESILIENCE, ["tried again", "kept going", "didn't give up", "fell", "failed", "practice"]],
];

/** Simple keyword heuristic used when the caller lets the app decide the domain. */
export function guessFromText(text) {
  if (!text) return DOMAINS.PERSONAL_DEVELOPMENT;
  const t = text.toLowerCase();
  for (const [domain, keywords] of KEYWORDS) {
    if (keywords.some((k) => t.includes(k))) return domain;
  }
  return DOMAINS.PERSONAL_DEVELOPMENT;
}
