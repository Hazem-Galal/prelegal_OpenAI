# Debug log — Mutual NDA Creator

Bugs found during manual testing and the Phase 6 code review (3 parallel
`code-reviewer` agents: simplicity/DRY, bugs/correctness, conventions), and
the fixes applied for each.

## 1. CRLF line endings broke template-fill regexes (found during manual testing)

**Symptom:** the MNDA term/confidentiality checkboxes and the signature
table never filled in — values stayed at their unfilled placeholder text in
the live preview and PDF, with no error thrown.

**Root cause:** `templates/mutual-nda/*.md` use `\r\n` (CRLF) line endings,
but the regexes in `lib/mnda.ts` assumed bare `\n`. `String.replace()` with
a non-matching regex is a silent no-op — no exception, just the original
text passed through unchanged.

**Fix:** changed every multi-line regex in `fillCoverPage` to use `\r?\n`
instead of `\n`.

**Verified:** ran `fillMndaDocument` against the real template files with a
standalone script and confirmed every placeholder (checkboxes, signature
table, brackets) resolved to the supplied values with none left unfilled.

## 2. Duplicated "courts located in" phrase (found during manual testing)

**Symptom:** filling Jurisdiction with `"courts located in New Castle, DE"`
produced `"...courts located in courts located in New Castle, DE."` in the
standard terms, because the surrounding sentence already says "courts
located in" before the `Jurisdiction` placeholder.

**Fix:** changed the form's Jurisdiction label/placeholder to ask for just
the place (`"e.g. New Castle, DE"`) instead of the full phrase.

**Verified:** re-ran the standalone script and confirmed the sentence reads
correctly with no duplication.

## 3. Unescaped `$` in replacement strings could corrupt the document (code review — bugs/correctness agent, confidence 90)

**Symptom (would-be):** `String.prototype.replace()` specially interprets
`$&`, `` $` ``, `$'`, and `$$` in its *replacement string* argument. Every
free-text form field (purpose, governing law, jurisdiction, all party
name/title/company/notice-address fields) was interpolated into a string
and passed directly as that 2nd argument. A user typing, e.g., a company
name containing `$&` would have had the entire matched regex block
substituted in place of their text — silent document corruption, no error.

**Fix:** every `.replace()` call in `lib/mnda.ts` now passes a replacer
*function* (`() => computedString`) instead of a string. Replacer function
return values are never reinterpreted for `$`-patterns, so this class of
bug is closed structurally rather than by escaping each value individually.

**Verified:** added a regression test with a company name containing
`$&`, `` $` ``, `$'`, and `$$` — confirmed the literal text passes through
intact and the document isn't corrupted/truncated.

## 4. `NaN` could leak into the generated document (code review — bugs/correctness agent, confidence 90)

**Symptom (would-be):** the MNDA Term / Confidentiality Term number inputs
called `Number(event.target.value)` with no guard. While editing (e.g.
typing `-` as the first character), this can evaluate to `NaN`, which then
flows into `describeMndaTerm`/`describeConfidentialityTerm` and renders as
literal `"NaN year(s) from Effective Date"` in the preview and PDF.

**Fix:** two layers —
- `components/NdaForm.tsx`: added `parseYears()`, clamping the input to a
  finite number `>= 1` (defaulting to `1`) before calling `onUpdate`.
- `lib/mnda.ts`: added `sanitizeYears()` and applied it everywhere
  `mndaTermYears`/`confidentialityTermYears` are interpolated into output
  text, so the library layer doesn't trust its input blindly even if a
  future caller bypasses the form's guard.

**Verified:** regression test constructing `MndaFormValues` with
`mndaTermYears: NaN` directly (bypassing the form) confirmed no `"NaN"`
string appears anywhere in the generated cover page.

## 5. Unsound type cast defeated `onUpdate`'s generic safety (code review — conventions agent, confidence 85)

**Symptom (would-be):** `components/NdaForm.tsx` built dynamic field keys
with `` `party1${field}` as keyof MndaFormValues ``. The `as` cast widened
the inferred generic `K` on `onUpdate<K extends keyof MndaFormValues>` to
the *entire* key union instead of a specific literal key, so
`MndaFormValues[K]` collapsed to a union of every field's value type. The
generic stopped actually verifying that a given field name pairs with a
correctly-typed value — nothing broke today, but a future change could
silently pass a bad value/key pair through unchecked.

**Fix:** replaced the single generic `onChange(field, value)` callback on
`PartyFields` with four explicit, separately-typed callbacks
(`onNameChange`, `onCompanyChange`, `onTitleChange`,
`onNoticeAddressChange`). Each call site now calls `onUpdate` with a
literal string key, so `K` is correctly inferred and there's no `as` cast
anywhere in the file.

**Verified:** `npm run build` (which runs the TypeScript checker) passes
with no type errors after removing the cast.

## 6. Triplicated default-purpose string risked silent drift (code review — simplicity/DRY agent, confidence 85)

**Symptom (would-be):** the literal sentence "Evaluating whether to enter
into a business relationship with the other party." existed independently
in three places: the markdown template, the `defaultPurpose` JS constant,
and a separate regex literal matching the bracketed placeholder. If the
template wording were ever edited, the hardcoded regex would silently stop
matching and the placeholder would be left unfilled with no warning.

**Fix:** the regex is now derived from the `defaultPurpose` constant itself
via a new `escapeRegExp()` helper (`defaultPurposePattern`), so there is a
single source of truth instead of two independent literals.

**Verified:** re-ran the existing template-fill regression test — purpose
substitution still works identically.

## 7. No detection when a template regex silently fails to match (code review — simplicity/DRY agent, confidence 80)

**Fix:** added `replaceTemplate()`, a small wrapper around
`String.replace()` that tracks (via a flag set inside the replacer
callback) whether the regex actually matched, and `console.warn`s in
non-production builds if it didn't — turning future template/regex drift
(like bug #1 above) into an immediate, visible warning instead of a silent
unfilled placeholder.

**Follow-up bug found while testing this fix:** the first version of this
check compared `result === template` (i.e. "did the string change") rather
than "did the regex match." When the replacement text happens to equal the
original placeholder text (e.g. an empty `effectiveDate` makes
`formatDate()` return the literal string `"[Today's date]"`, replacing the
placeholder with itself), the comparison produced a **false-positive
warning** even though the pattern matched correctly. Fixed by tracking a
`matched` boolean set inside the replacer callback instead of comparing
strings.
