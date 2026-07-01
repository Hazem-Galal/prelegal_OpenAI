import { highlight } from "@/lib/highlight";

export type FieldValues = Record<string, string | null | undefined>;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Fills a generic template by replacing every `<span class="X_link">Variable</span>`
 * tag with the matching value from `fields`, keyed by the variable's own text.
 * Matches any `_link`-suffixed class (coverpage_link, keyterms_link, orderform_link,
 * etc.) so it works across every template without per-document configuration.
 */
export function fillGenericDocument(template: string, fields: FieldValues): string {
  let result = template;

  for (const [variable, value] of Object.entries(fields)) {
    // Match any attribute order/combination on the span (e.g. a trailing
    // `id="..."`), mirroring the backend's permissive extraction in fields.py —
    // some templates put other attributes alongside the `_link` class.
    const pattern = new RegExp(
      `<span\\s+[^>]*class="\\w+_link"[^>]*>${escapeRegExp(variable)}</span>`,
      "g"
    );
    result = result.replace(pattern, () => highlight(value ?? ""));
  }

  return result;
}
