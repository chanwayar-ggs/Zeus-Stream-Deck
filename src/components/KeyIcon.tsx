import React from 'react';
import * as Icons from 'lucide-react';

interface KeyIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const KeyIcon: React.FC<KeyIconProps> = ({ name, className = 'w-6 h-6', size = 24 }) => {
  if (!name) return null;

  // If it's an emoji or multi-byte unicode
  if (/\p{Emoji}/u.test(name) && name.length <= 4) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{name}</span>;
  }

  // Look up icon in lucide-react
  const IconComponent = (Icons as any)[name];
  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }

  // Fallback to text initials or default
  return <span className="font-bold text-xs uppercase">{name.slice(0, 3)}</span>;
};
