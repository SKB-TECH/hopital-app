const NUMBER_LOCALES: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
};

/** Locale stable pour éviter les écarts d’hydratation SSR / navigateur. */
export function formatNumber(value: number, locale: string): string {
  const resolved = NUMBER_LOCALES[locale] ?? locale;
  return value.toLocaleString(resolved);
}

export function formatCurrency(value: number, locale: string): string {
  return `$${formatNumber(value, locale)}`;
}
