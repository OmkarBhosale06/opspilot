import { formatDistanceToNowStrict, format, parseISO } from "date-fns";

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, HH:mm:ss");
  } catch {
    return iso;
  }
}

export function formatDuration(
  start: string | null | undefined,
  end?: string | null
): string {
  if (!start) return "—";
  try {
    const from = parseISO(start).getTime();
    const to = end ? parseISO(end).getTime() : Date.now();
    const ms = Math.max(0, to - from);
    const minutes = Math.floor(ms / 60_000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (hours < 48) return `${hours}h ${rem}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  } catch {
    return "—";
  }
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(digits)}%`;
}

export function shortImage(image: string): string {
  const tag = image.split(":").pop();
  return tag && tag !== image ? tag : image.split("/").pop() ?? image;
}
