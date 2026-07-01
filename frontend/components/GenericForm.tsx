"use client";

import type { FieldValues } from "@/lib/genericDocument";

type Props = {
  fields: string[];
  values: FieldValues;
  onUpdate: (field: string, value: string) => void;
};

export default function GenericForm({ fields, values, onUpdate }: Props) {
  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-neutral-100 bg-white p-5 shadow-xs dark:border-neutral-700 dark:bg-neutral-900/40"
      onSubmit={(event) => event.preventDefault()}
    >
      {fields.map((field) => (
        <label key={field} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">{field}</span>
          <input
            type="text"
            value={values[field] ?? ""}
            onChange={(event) => onUpdate(field, event.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </label>
      ))}
    </form>
  );
}
