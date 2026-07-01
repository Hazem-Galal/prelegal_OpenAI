export function highlight(value: string): string {
  const safe = value && value.trim() ? value : "[Not provided]";
  return `<span class="filled-field">${safe}</span>`;
}
