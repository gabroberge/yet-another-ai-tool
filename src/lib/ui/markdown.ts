import { esc } from "./html";

function inline(text: string): string {
  return esc(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/** Renders the subset of Markdown the artifact generator emits. */
export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) code.push(lines[i++]!.replace(/^ {3}/, ""));
      i++;
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
      continue;
    }
    if (trimmed === "---" && i === 0) {
      const fm: string[] = [];
      i++;
      while (i < lines.length && lines[i]!.trim() !== "---") fm.push(lines[i++]!);
      i++;
      const fields = fm
        .map((l) => l.match(/^([\w-]+):\s*(.*)$/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map(([, key, value]) => `<div><dt>${esc(key!)}</dt><dd>${esc(value!)}</dd></div>`);
      out.push(`<dl class="frontmatter">${fields.join("")}</dl>`);
      continue;
    }
    const heading = trimmed.match(/^(#{1,3}) (.*)$/);
    if (heading) {
      const level = heading[1]!.length + 1;
      out.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
      i++;
      continue;
    }
    if (trimmed.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("|")) {
        const cells = lines[i]!.trim().slice(1, -1).split("|").map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      const hasHead = head && head.some(Boolean);
      out.push(
        `<table>${hasHead ? `<thead><tr>${head!.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` : ""}<tbody>${(hasHead ? body : rows.slice(1))
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`,
      );
      continue;
    }
    if (/^(- |\d+\. )/.test(trimmed)) {
      const ordered = /^\d+\. /.test(trimmed);
      const items: string[] = [];
      while (i < lines.length && /^(- |\d+\. )/.test(lines[i]!.trim())) {
        let item = lines[i]!.trim().replace(/^(- |\d+\. )/, "");
        i++;
        const extra: string[] = [];
        while (i < lines.length && /^\s{3,}\S/.test(lines[i]!) || (i < lines.length && lines[i]!.trim() === "" && /^\s{3}/.test(lines[i + 1] ?? ""))) {
          extra.push(lines[i]!);
          i++;
        }
        const nested = extra.length ? renderMarkdown(extra.join("\n").replace(/^ {3}/gm, "")) : "";
        items.push(`<li>${inline(item)}${nested}</li>`);
        item = "";
      }
      out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }
    if (trimmed.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("> ")) quote.push(lines[i++]!.trim().slice(2));
      out.push(`<blockquote><p>${inline(quote[0]!)}</p>${quote.slice(1).map((q) => `<cite>${inline(q)}</cite>`).join("")}</blockquote>`);
      continue;
    }
    if (trimmed) out.push(`<p>${inline(trimmed)}</p>`);
    i++;
  }
  return out.join("\n");
}
