import { hashString } from "../generation/rng";

/** Fixed reference date so relative parsing stays deterministic. */
export const REFERENCE_DATE = new Date(Date.UTC(2026, 10, 16));

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function isoDay(d: Date): string {
  const weekday = WEEKDAYS[d.getUTCDay()]!;
  return `${d.toISOString().slice(0, 10)} (${weekday[0]!.toUpperCase()}${weekday.slice(1)})`;
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

export function formatJson(input: string): string {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch (err) {
    return `parse error: ${(err as Error).message}`;
  }
}

export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length]!;
}

function splitPair(input: string): [string, string] {
  const parts = input.includes("\n") ? input.split("\n") : input.split(",");
  return [(parts[0] ?? "").trim(), parts.slice(1).join(",").trim()];
}

export function editDistance(input: string): string {
  const [a, b] = splitPair(input);
  return `distance("${a}", "${b}") = ${levenshtein(a, b)}`;
}

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function cosineSimilarity(input: string): string {
  const [a, b] = splitPair(input.replace("|", "\n"));
  const ta = tokens(a);
  const tb = tokens(b);
  const vocab = [...new Set([...ta, ...tb])];
  const va = vocab.map((w) => ta.filter((t) => t === w).length);
  const vb = vocab.map((w) => tb.filter((t) => t === w).length);
  const dot = va.reduce((s, x, i) => s + x * vb[i]!, 0);
  const mag = Math.sqrt(va.reduce((s, x) => s + x * x, 0)) * Math.sqrt(vb.reduce((s, x) => s + x * x, 0));
  const score = mag === 0 ? 0 : dot / mag;
  return `cosine similarity = ${score.toFixed(4)}`;
}

export function parseDate(input: string, ref: Date = REFERENCE_DATE): string {
  const text = input.trim().toLowerCase();
  if (!text) return "error: empty input";
  if (text === "today" || text === "now") return isoDay(ref);
  if (text === "tomorrow") return isoDay(addDays(ref, 1));
  if (text === "yesterday") return isoDay(addDays(ref, -1));

  const rel = text.match(/^in (\d+) (day|days|week|weeks)$/);
  if (rel) {
    const n = Number(rel[1]) * (rel[2]!.startsWith("week") ? 7 : 1);
    return isoDay(addDays(ref, n));
  }

  const next = text.match(/^(next|this) ([a-z]+)$/);
  if (next && WEEKDAYS.includes(next[2]!)) {
    const target = WEEKDAYS.indexOf(next[2]!);
    let delta = (target - ref.getUTCDay() + 7) % 7;
    if (delta === 0 || next[1] === "next") delta = delta === 0 ? 7 : delta;
    return isoDay(addDays(ref, delta));
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return Number.isNaN(d.getTime()) ? "error: invalid date" : isoDay(d);
  }

  const long = text.match(/^([a-z]+) (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})$/);
  if (long && MONTHS.includes(long[1]!)) {
    return isoDay(new Date(Date.UTC(Number(long[3]), MONTHS.indexOf(long[1]!), Number(long[2]))));
  }

  return `error: unrecognized date "${input.trim()}"`;
}

export function lint(code: string): string {
  const findings: string[] = [];
  const lines = code.split("\n");
  lines.forEach((line, i) => {
    const eq = line.search(/[^=!]==[^=]/);
    if (eq >= 0) findings.push(`${i + 1}:${eq + 2}  warning  Expected '===' and instead saw '=='  eqeqeq`);
    const log = line.indexOf("console.log");
    if (log >= 0) findings.push(`${i + 1}:${log + 1}  warning  Unexpected console statement  no-console`);
    const v = line.search(/\bvar\s/);
    if (v >= 0) findings.push(`${i + 1}:${v + 1}  error    Unexpected var, use let or const  no-var`);
  });
  const declared = [...code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]!);
  for (const name of declared) {
    const uses = code.match(new RegExp(`\\b${name.replace(/\$/g, "\\$")}\\b`, "g"))?.length ?? 0;
    if (uses === 1) findings.push(`'${name}' is assigned a value but never used  no-unused-vars`);
  }
  if (findings.length === 0) return "0 problems";
  return `${findings.join("\n")}\n\n${findings.length} problem${findings.length === 1 ? "" : "s"}`;
}

function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, "").split(/[/?#]/)[0] || "localhost";
}

function normalizeUrl(input: string): string {
  const url = input.trim() || "example.com";
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export function browserTest(input: string): string {
  const url = normalizeUrl(input);
  const host = hostOf(url);
  const title = host.split(".")[0]!.replace(/^\w/, (c) => c.toUpperCase());
  const secs = (0.8 + (hashString(url) % 900) / 1000).toFixed(1);
  return [
    `Running 1 test using 1 worker`,
    `  ✓ loads ${host} and finds the sign-up button (${secs}s)`,
    `    page.goto("${url}") → 200`,
    `    expect(page).toHaveTitle(/${title}/)`,
    `  1 passed (${secs}s)`,
  ].join("\n");
}

export function healthCheck(input: string): string {
  const url = normalizeUrl(input);
  const h = hashString(url);
  const down = h % 11 === 0;
  return [
    `HTTP/2 ${down ? "503" : "200"}`,
    `server: ${hostOf(url)}`,
    `time_total: ${(40 + (h % 260)) / 1000}s`,
  ].join("\n");
}

function describeField(field: string, unit: string, names?: string[]): string | null {
  if (field === "*") return null;
  const step = field.match(/^\*\/(\d+)$/);
  if (step) return `every ${step[1]} ${unit}s`;
  const label = (n: string) => (names ? (names[Number(n)] ?? n) : n);
  const range = field.match(/^(\d+)-(\d+)$/);
  if (range) return `${label(range[1]!)} through ${label(range[2]!)}`;
  return field.split(",").map(label).join(", ");
}

export function describeCron(input: string): string {
  const parts = input.trim().split(/\s+/);
  if (parts.length !== 5) return `error: expected 5 fields, got ${parts.length}`;
  const [min, hour, dom, mon, dow] = parts as [string, string, string, string, string];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let time: string;
  if (/^\d+$/.test(min) && /^\d+$/.test(hour)) {
    time = `At ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  } else {
    const m = describeField(min, "minute");
    const h = describeField(hour, "hour");
    time = [m ? `At minute ${m}` : "Every minute", h ? `past hour ${h}` : ""].filter(Boolean).join(" ");
  }
  const segs = [time];
  const d = describeField(dom, "day");
  if (d) segs.push(`on day-of-month ${d}`);
  const w = describeField(dow, "day", days);
  if (w) segs.push(`on ${w}`);
  const mo = describeField(mon, "month", months);
  if (mo) segs.push(`in ${mo}`);
  return segs.join(", ");
}

export function sendEmail(input: string): string {
  const to = input.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return `422 Unprocessable Entity\nerror: invalid recipient "${to}"`;
  return `202 Accepted\nmessage_id: msg_${hashString(to).toString(36)}\nstatus: queued`;
}

export function redact(input: string): string {
  return input
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[EMAIL]")
    .replace(/\b(?:\d[ -]?){13,16}\b/g, "[CARD]")
    .replace(/\+?\d{1,2}?[ .-]?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g, "[PHONE]");
}

export function parseCsv(input: string): string {
  const rows = input
    .trim()
    .split("\n")
    .filter((r) => r.trim())
    .map((r) => r.split(",").map((c) => c.trim()));
  if (rows.length === 0) return "0 rows";
  const [header, ...body] = rows as [string[], ...string[][]];
  const records = body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
  return `${records.length} rows × ${header.length} columns\n${JSON.stringify(records, null, 2)}`;
}

const KNOWN_PLACES: Record<string, [number, number]> = {
  montreal: [45.5019, -73.5674],
  "montréal": [45.5019, -73.5674],
  paris: [48.8566, 2.3522],
  tokyo: [35.6764, 139.65],
  london: [51.5072, -0.1276],
  "new york": [40.7128, -74.006],
  toronto: [43.6532, -79.3832],
};

export function geocode(input: string): string {
  const key = input.trim().toLowerCase();
  const known = Object.entries(KNOWN_PLACES).find(([name]) => key.includes(name));
  const h = hashString(key);
  const [lat, lng] = known?.[1] ?? [((h % 12000) / 100 - 60), (((h >>> 8) % 34000) / 100 - 170)];
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}\naccuracy: ${known ? "rooftop" : "approximate"}`;
}

export function resizeImage(input: string): string {
  const m = input.match(/(\d+)\s*[x×]\s*(\d+)\D+(\d+)\s*w/i);
  if (!m) return 'error: expected "WIDTHxHEIGHT to TARGETw"';
  const [w, h, target] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!w || !h || !target) return "error: dimensions must be positive";
  return `${w}×${h} → ${target}×${Math.round((h * target) / w)}`;
}

export function wordDiff(input: string): string {
  const [a, b] = splitPair(input);
  const x = a.split(/\s+/).filter(Boolean);
  const y = b.split(/\s+/).filter(Boolean);
  const dp = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) {
    for (let j = y.length - 1; j >= 0; j--) {
      dp[i]![j] = x[i] === y[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) {
      out.push(`  ${x[i]}`);
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      out.push(`- ${x[i++]}`);
    } else {
      out.push(`+ ${y[j++]}`);
    }
  }
  while (i < x.length) out.push(`- ${x[i++]}`);
  while (j < y.length) out.push(`+ ${y[j++]}`);
  return out.join("\n");
}

export function renameFiles(input: string): string {
  return input
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .map((f) => {
      const dot = f.lastIndexOf(".");
      const [base, ext] = dot > 0 ? [f.slice(0, dot), f.slice(dot + 1)] : [f, ""];
      const slug = base
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return `${f} → ${slug}${ext ? `.${ext.toLowerCase()}` : ""}`;
    })
    .join("\n");
}

const MISSPELLINGS: Record<string, string> = {
  recieve: "receive",
  seperate: "separate",
  definately: "definitely",
  occured: "occurred",
  untill: "until",
  wich: "which",
  accomodate: "accommodate",
  acheive: "achieve",
  beleive: "believe",
  calender: "calendar",
  enviroment: "environment",
  goverment: "government",
  independant: "independent",
  occurence: "occurrence",
  publically: "publicly",
  teh: "the",
  thier: "their",
  tommorow: "tomorrow",
  wierd: "weird",
  adress: "address",
};

export function spellcheck(input: string): string {
  let fixes = 0;
  const out = input.replace(/[A-Za-z]+/g, (word) => {
    const fix = MISSPELLINGS[word.toLowerCase()];
    if (!fix) return word;
    fixes++;
    return word[0] === word[0]!.toUpperCase() ? fix[0]!.toUpperCase() + fix.slice(1) : fix;
  });
  return `${out}\n\n${fixes} correction${fixes === 1 ? "" : "s"}`;
}

/** Units of currency per 1 USD. Fixed snapshot. */
const RATES: Record<string, number> = { USD: 1, EUR: 0.92, CAD: 1.37, GBP: 0.79, JPY: 151.2, CHF: 0.88, AUD: 1.52 };

export function convertCurrency(input: string): string {
  const m = input.trim().toUpperCase().match(/^([\d.,]+)\s*([A-Z]{3})\s+(?:TO|IN)\s+([A-Z]{3})$/);
  if (!m) return 'error: expected "AMOUNT CUR to CUR"';
  const amount = Number(m[1]!.replace(/,/g, ""));
  const from = RATES[m[2]!];
  const to = RATES[m[3]!];
  if (!from || !to) return `error: unsupported currency`;
  const result = (amount / from) * to;
  return `${amount.toFixed(2)} ${m[2]} = ${result.toFixed(2)} ${m[3]}\nrate: ${(to / from).toFixed(4)}`;
}

const CONDITIONS = ["clear skies", "light rain", "overcast", "scattered showers", "light snow", "fog, clearing by noon", "windy"];

export function weatherForecast(input: string): string {
  const city = input.trim() || "Montréal";
  const h = hashString(city.toLowerCase());
  const high = (h % 30) - 4;
  const low = high - 3 - (h % 7);
  return [
    `location: ${city}`,
    `tomorrow: ${high}°C / ${low}°C, ${CONDITIONS[h % CONDITIONS.length]}`,
    `precipitation: ${(h >>> 4) % 100}%`,
  ].join("\n");
}
