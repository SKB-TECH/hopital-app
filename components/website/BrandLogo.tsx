import Image from "next/image";

type Props = {
  tone?: "light" | "dark";
  size?: "sm" | "md";
};

export function BrandLogo({ tone = "dark", size = "md" }: Props) {
  const imageSize = size === "sm" ? 32 : 40;

  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src="/images/logo.jpeg"
        alt="Kongo Event"
        width={imageSize}
        height={imageSize}
        className="rounded-md object-cover"
        priority={size === "md"}
      />
      <span
        className={`font-extrabold ${
          size === "sm" ? "text-xl" : "text-2xl"
        } ${tone === "light" ? "text-white" : "text-[#005995]"}`}
      >
        Kongo Event
      </span>
    </span>
  );
}
