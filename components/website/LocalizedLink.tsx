"use client";

import Link, { type LinkProps } from "next/link";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & {
    children: React.ReactNode;
  };

export function LocalizedLink({ href, children, ...props }: Props) {
  const { getLocalizedHref } = useLocalizedPath();
  const rawHref = typeof href === "string" ? href : href.pathname ?? "/";
  const localizedHref = rawHref.startsWith("http")
    ? rawHref
    : getLocalizedHref(rawHref);

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}
