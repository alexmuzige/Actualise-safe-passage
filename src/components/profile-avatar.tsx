interface ProfileAvatarProps {
  image: string | null;
  initials: string;
  color: string;
  className: string;
}

export function ProfileAvatar({ image, initials, color, className }: ProfileAvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-background ${className}`}
      style={{ backgroundColor: color }}
    >
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : initials}
    </div>
  );
}
