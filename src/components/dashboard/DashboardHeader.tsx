
import React from "react";
import { Award } from "lucide-react";

interface DashboardHeaderProps {
  isLoading: boolean;
  language: 'en' | 'sw';
  points: number;
}

export function DashboardHeader({ isLoading, language, points }: DashboardHeaderProps) {
  if (isLoading) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's an overview of your account.</p>
      </div>

      <div className="flex justify-end mb-4">
        <div className="points-indicator">
          <Award className="h-4 w-4 text-green-600" />
          <span>{points} {language === 'en' ? "Points" : "Pointi"}</span>
        </div>
      </div>
    </>
  );
}
