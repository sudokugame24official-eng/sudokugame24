import { createNavigation } from "next-intl/navigation";

export const locales = ["en", "fr", "de", "es", "it"] as const;

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
});
