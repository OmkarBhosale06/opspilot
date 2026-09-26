import type { Incident } from "../repositories/incidents.js";

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "after",
  "from",
]);

export function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export function similarText(incident: Incident): string {
  return [
    incident.title,
    incident.summary,
    incident.service,
    incident.rootCause.summary,
    incident.rootCause.change,
    incident.remediation.action,
  ].join(" ");
}

export function similarityScore(a: Incident, b: Incident): number {
  let score = 0;
  if (a.service === b.service) score += 0.4;
  if (a.namespace === b.namespace) score += 0.1;
  if (
    a.rootCause.change &&
    b.rootCause.change &&
    a.rootCause.change === b.rootCause.change
  ) {
    score += 0.15;
  }
  score += 0.35 * jaccard(tokens(similarText(a)), tokens(similarText(b)));
  return Math.min(1, Number(score.toFixed(3)));
}

export type SimilarHit = {
  id: string;
  title: string;
  resolution: string;
  similarity: number;
};

export function recallSimilar(
  incident: Incident,
  catalog: Incident[],
  limit = 5
): SimilarHit[] {
  return catalog
    .filter((other) => other.id !== incident.id)
    .map((other) => ({
      id: other.id,
      title: other.title,
      resolution:
        other.status === "resolved" || other.status === "closed"
          ? `${other.remediation.action} ${other.remediation.toVersion}`
          : other.status,
      similarity: similarityScore(incident, other),
    }))
    .filter((hit) => hit.similarity >= 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
