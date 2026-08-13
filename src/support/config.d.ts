export type SupportOption = Readonly<{ value: string; label: string }>;
export const PRODUCT_OPTIONS: readonly SupportOption[];
export const SYSTEM_OPTIONS: readonly SupportOption[];
export const ISSUE_TYPE_OPTIONS: readonly SupportOption[];
export function optionLabel(options: readonly SupportOption[], value: string): string | undefined;
