"use client";

import type { MndaFormValues } from "@/lib/mnda";

type Props = {
  values: MndaFormValues;
  onUpdate: <K extends keyof MndaFormValues>(
    field: K,
    value: MndaFormValues[K]
  ) => void;
};

function parseYears(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
      />
    </label>
  );
}

function PartyFields({
  title,
  name,
  company,
  partyTitle,
  noticeAddress,
  onNameChange,
  onCompanyChange,
  onTitleChange,
  onNoticeAddressChange,
}: {
  title: string;
  name: string;
  company: string;
  partyTitle: string;
  noticeAddress: string;
  onNameChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onNoticeAddressChange: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-neutral-100 bg-white p-5 shadow-xs dark:border-neutral-700 dark:bg-neutral-900/40">
      <legend className="px-1 text-sm font-semibold text-primary dark:text-neutral-100">{title}</legend>
      <TextField label="Name" value={name} onChange={onNameChange} />
      <TextField label="Company" value={company} onChange={onCompanyChange} />
      <TextField label="Title" value={partyTitle} onChange={onTitleChange} />
      <TextField
        label="Notice address"
        value={noticeAddress}
        onChange={onNoticeAddressChange}
        placeholder="Email or postal address"
      />
    </fieldset>
  );
}

export default function NdaForm({ values, onUpdate }: Props) {
  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PartyFields
          title="Party 1"
          name={values.party1Name}
          company={values.party1Company}
          partyTitle={values.party1Title}
          noticeAddress={values.party1NoticeAddress}
          onNameChange={(v) => onUpdate("party1Name", v)}
          onCompanyChange={(v) => onUpdate("party1Company", v)}
          onTitleChange={(v) => onUpdate("party1Title", v)}
          onNoticeAddressChange={(v) => onUpdate("party1NoticeAddress", v)}
        />
        <PartyFields
          title="Party 2"
          name={values.party2Name}
          company={values.party2Company}
          partyTitle={values.party2Title}
          noticeAddress={values.party2NoticeAddress}
          onNameChange={(v) => onUpdate("party2Name", v)}
          onCompanyChange={(v) => onUpdate("party2Company", v)}
          onTitleChange={(v) => onUpdate("party2Title", v)}
          onNoticeAddressChange={(v) => onUpdate("party2NoticeAddress", v)}
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">Purpose</span>
        <textarea
          value={values.purpose}
          onChange={(event) => onUpdate("purpose", event.target.value)}
          rows={3}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </label>

      <TextField
        label="Effective date"
        type="date"
        value={values.effectiveDate}
        onChange={(v) => onUpdate("effectiveDate", v)}
      />

      <fieldset className="flex flex-col gap-3 rounded-xl border border-neutral-100 bg-white p-5 shadow-xs dark:border-neutral-700 dark:bg-neutral-900/40">
        <legend className="px-1 text-sm font-semibold text-primary dark:text-neutral-100">MNDA term</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            className="accent-primary"
            name="mndaTermType"
            checked={values.mndaTermType === "expires"}
            onChange={() => onUpdate("mndaTermType", "expires")}
          />
          Expires
          <input
            type="number"
            min={1}
            value={values.mndaTermYears}
            disabled={values.mndaTermType !== "expires"}
            onChange={(event) => onUpdate("mndaTermYears", parseYears(event.target.value))}
            className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm shadow-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:disabled:bg-neutral-700"
          />
          year(s) from Effective Date
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            className="accent-primary"
            name="mndaTermType"
            checked={values.mndaTermType === "continues"}
            onChange={() => onUpdate("mndaTermType", "continues")}
          />
          Continues until terminated in accordance with the terms of the MNDA
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-neutral-100 bg-white p-5 shadow-xs dark:border-neutral-700 dark:bg-neutral-900/40">
        <legend className="px-1 text-sm font-semibold text-primary dark:text-neutral-100">Term of confidentiality</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            className="accent-primary"
            name="confidentialityTermType"
            checked={values.confidentialityTermType === "duration"}
            onChange={() => onUpdate("confidentialityTermType", "duration")}
          />
          <input
            type="number"
            min={1}
            value={values.confidentialityTermYears}
            disabled={values.confidentialityTermType !== "duration"}
            onChange={(event) =>
              onUpdate("confidentialityTermYears", parseYears(event.target.value))
            }
            className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm shadow-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:disabled:bg-neutral-700"
          />
          year(s) from Effective Date (trade secrets survive until no longer a trade secret)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            className="accent-primary"
            name="confidentialityTermType"
            checked={values.confidentialityTermType === "perpetuity"}
            onChange={() => onUpdate("confidentialityTermType", "perpetuity")}
          />
          In perpetuity
        </label>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Governing law (state)"
          value={values.governingLaw}
          onChange={(v) => onUpdate("governingLaw", v)}
          placeholder="e.g. Delaware"
        />
        <TextField
          label="Jurisdiction (city/county & state)"
          value={values.jurisdiction}
          onChange={(v) => onUpdate("jurisdiction", v)}
          placeholder="e.g. New Castle, DE"
        />
      </div>
    </form>
  );
}
