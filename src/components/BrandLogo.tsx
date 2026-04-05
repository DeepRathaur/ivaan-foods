import Image from "next/image";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ size = 176, className = "", priority = false }: Props) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full shadow-lg ring-2 ring-amber-400/40 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/ivaan-logo.png"
        alt="Ivaan Foods"
        fill
        className="object-cover"
        sizes={`${size}px`}
        priority={priority}
      />
    </div>
  );
}
