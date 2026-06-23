import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";

type LogoProps = {
  withText?: boolean;
};

export function Logo({ withText = true }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src={siteConfig.logo}
        alt={siteConfig.name}
        width={54}
        height={54}
        className="rounded object-contain"
        priority
      />

      {withText ? (
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-wide text-primary">KONGO</p>
          <p className="text-xs font-bold tracking-[0.35em] text-destructive">EVENT</p>
        </div>
      ) : null}
    </Link>
  );
}
