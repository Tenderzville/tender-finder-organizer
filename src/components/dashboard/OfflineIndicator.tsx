
import React from "react";
import { WifiOff } from "lucide-react";

interface OfflineIndicatorProps {
  isOnline: boolean;
  language: 'en' | 'sw';
}

export function OfflineIndicator({ isOnline, language }: OfflineIndicatorProps) {
  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-indicator">
      <WifiOff className="h-4 w-4" />
      <span>{language === 'en' ? "You're offline" : "Uko nje ya mtandao"}</span>
    </div>
  );
}
