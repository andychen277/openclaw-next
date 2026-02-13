'use client';

interface Platform {
  id: string;
  label: string;
  icon: string;
}

interface PlatformButtonProps {
  platform: Platform;
  isAuthenticated: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onAuth: () => void;
}

export default function PlatformButton({
  platform,
  isAuthenticated,
  isSelected,
  onToggle,
  onAuth,
}: PlatformButtonProps) {
  if (!isAuthenticated) {
    return (
      <button
        onClick={onAuth}
        className="btn-secondary w-full text-sm py-2"
      >
        <span className="mr-1">{platform.icon}</span>
        連接 {platform.label}
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={`btn-secondary w-full text-sm py-2 transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
          : ''
      }`}
    >
      <span className="mr-1">{platform.icon}</span>
      {platform.label}
      {isSelected && <span className="ml-1">✓</span>}
    </button>
  );
}
