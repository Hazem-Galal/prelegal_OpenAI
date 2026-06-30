export type MndaFormValues = {
  party1Name: string;
  party1Company: string;
  party1Title: string;
  party1NoticeAddress: string;
  party2Name: string;
  party2Company: string;
  party2Title: string;
  party2NoticeAddress: string;
  purpose: string;
  effectiveDate: string;
  mndaTermType: "expires" | "continues";
  mndaTermYears: number;
  confidentialityTermType: "duration" | "perpetuity";
  confidentialityTermYears: number;
  governingLaw: string;
  jurisdiction: string;
};

const defaultPurpose =
  "Evaluating whether to enter into a business relationship with the other party.";

export const defaultMndaFormValues: MndaFormValues = {
  party1Name: "",
  party1Company: "",
  party1Title: "",
  party1NoticeAddress: "",
  party2Name: "",
  party2Company: "",
  party2Title: "",
  party2NoticeAddress: "",
  purpose: defaultPurpose,
  effectiveDate: "",
  mndaTermType: "expires",
  mndaTermYears: 1,
  confidentialityTermType: "duration",
  confidentialityTermYears: 1,
  governingLaw: "",
  jurisdiction: "",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const defaultPurposePattern = new RegExp(`\\[${escapeRegExp(defaultPurpose)}\\]`);

/**
 * Replaces `pattern` with the result of `build()`. Uses a replacer function (not a string) so
 * literal `$` sequences in user input are never reinterpreted by String.replace, and warns in
 * development if the pattern didn't match, since that means the template text and this regex
 * have drifted out of sync and the placeholder will silently remain unfilled.
 */
function replaceTemplate(
  template: string,
  pattern: RegExp,
  build: () => string,
  label: string
): string {
  let matched = false;
  const result = template.replace(pattern, () => {
    matched = true;
    return build();
  });
  if (process.env.NODE_ENV !== "production" && !matched) {
    console.warn(`mnda template: pattern for "${label}" did not match`);
  }
  return result;
}

/** Coerces possibly-invalid year counts (NaN, 0, negative) to a sane positive default. */
function sanitizeYears(years: number): number {
  return Number.isFinite(years) && years >= 1 ? years : 1;
}

function formatDate(value: string): string {
  if (!value) return "[Today’s date]";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function describeMndaTerm(values: MndaFormValues): string {
  return values.mndaTermType === "expires"
    ? `${sanitizeYears(values.mndaTermYears)} year(s) from Effective Date`
    : "until terminated in accordance with the terms of the MNDA";
}

function describeConfidentialityTerm(values: MndaFormValues): string {
  return values.confidentialityTermType === "duration"
    ? `${sanitizeYears(values.confidentialityTermYears)} year(s) from Effective Date`
    : "in perpetuity";
}

function highlight(value: string): string {
  const safe = value && value.trim() ? value : "[Not provided]";
  return `<span class="filled-field">${safe}</span>`;
}

/** Fills the Mutual NDA cover page template with the form values, replacing each bracketed placeholder in place. */
export function fillCoverPage(template: string, values: MndaFormValues): string {
  let result = template;

  result = replaceTemplate(
    result,
    defaultPurposePattern,
    () => values.purpose || defaultPurpose,
    "Purpose"
  );

  result = replaceTemplate(
    result,
    /\[Today.s date\]/,
    () => formatDate(values.effectiveDate),
    "Effective Date"
  );

  result = replaceTemplate(
    result,
    /- \[(?:x| )\]\s+Expires \[1 year\(s\)\] from Effective Date\.\r?\n- \[(?:x| )\]\s+Continues until terminated in accordance with the terms of the MNDA\./,
    () =>
      values.mndaTermType === "expires"
        ? `- [x]     Expires [${sanitizeYears(values.mndaTermYears)} year(s)] from Effective Date.\n- [ ]     Continues until terminated in accordance with the terms of the MNDA.`
        : `- [ ]     Expires [${sanitizeYears(values.mndaTermYears)} year(s)] from Effective Date.\n- [x]     Continues until terminated in accordance with the terms of the MNDA.`,
    "MNDA Term"
  );

  result = replaceTemplate(
    result,
    /- \[(?:x| )\]\s+\[1 year\(s\)\] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws\.\r?\n- \[(?:x| )\]\s+In perpetuity\./,
    () =>
      values.confidentialityTermType === "duration"
        ? `- [x]     [${sanitizeYears(values.confidentialityTermYears)} year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.\n- [ ]     In perpetuity.`
        : `- [ ]     [${sanitizeYears(values.confidentialityTermYears)} year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.\n- [x]     In perpetuity.`,
    "Term of Confidentiality"
  );

  result = replaceTemplate(
    result,
    /\[Fill in state\]/,
    () => values.governingLaw || "[Fill in state]",
    "Governing Law"
  );

  result = replaceTemplate(
    result,
    /\[Fill in city or county and state[^\]]*\]/,
    () => values.jurisdiction || "[Fill in city or county and state]",
    "Jurisdiction"
  );

  result = replaceTemplate(
    result,
    /\|\| PARTY 1 \| PARTY 2 \|\r?\n\|:--- \| :----: \| :----: \|\r?\n\| Signature \| \| \|\r?\n\| Print Name \|[^\n]*\r?\n\| Title \| \| \|\r?\n\| Company \| \| \|\r?\n\| Notice Address <label>Use either email or postal address<\/label> \| \| \|\r?\n\| Date \| \| \|/,
    () =>
      [
        "|| PARTY 1 | PARTY 2 |",
        "|:--- | :----: | :----: |",
        "| Signature | | |",
        `| Print Name | ${values.party1Name} | ${values.party2Name} |`,
        `| Title | ${values.party1Title} | ${values.party2Title} |`,
        `| Company | ${values.party1Company} | ${values.party2Company} |`,
        `| Notice Address <label>Use either email or postal address</label> | ${values.party1NoticeAddress} | ${values.party2NoticeAddress} |`,
        "| Date | | |",
      ].join("\n"),
    "Signature Table"
  );

  return result;
}

/** Fills the Mutual NDA standard terms, replacing each `coverpage_link` span with the resolved field value. */
export function fillStandardTerms(template: string, values: MndaFormValues): string {
  let result = template;

  const replacements: Record<string, string> = {
    Purpose: values.purpose || defaultPurpose,
    "Effective Date": formatDate(values.effectiveDate),
    "MNDA Term": describeMndaTerm(values),
    "Term of Confidentiality": describeConfidentialityTerm(values),
    "Governing Law": values.governingLaw || "[Fill in state]",
    Jurisdiction: values.jurisdiction || "[Fill in jurisdiction]",
  };

  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`<span class="coverpage_link">${key}</span>`, "g");
    result = result.replace(pattern, () => highlight(value));
  }

  return result;
}

export function fillMndaDocument(
  coverPageTemplate: string,
  standardTermsTemplate: string,
  values: MndaFormValues
): { coverPage: string; standardTerms: string } {
  return {
    coverPage: fillCoverPage(coverPageTemplate, values),
    standardTerms: fillStandardTerms(standardTermsTemplate, values),
  };
}
