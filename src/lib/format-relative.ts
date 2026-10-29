/** Short French relative time, e.g. "il y a 24 min". */
export function formatRelativeFr(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return "à l'instant";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;

  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `il y a ${diffD} j`;

  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export function formatLeadDateTimeFr(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** e.g. "11 h 24 min de retard" from a past due ISO date. */
export function formatOverdueFr(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then) || then >= now) return "";

  const totalMin = Math.max(1, Math.floor((now - then) / 60000));
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;

  if (days > 0) {
    return hours > 0
      ? `${days} j ${hours} h de retard`
      : `${days} j de retard`;
  }
  if (hours > 0) {
    return minutes > 0
      ? `${hours} h ${minutes} min de retard`
      : `${hours} h de retard`;
  }
  return `${minutes} min de retard`;
}

export function initialsFromName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !/^(m\.?r\.?|mme\.?|mlle\.?)$/i.test(part));

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
