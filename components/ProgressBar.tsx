// components/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  progress: number; // Percentage from 0 to 100
  label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-medium text-[var(--button-gradient-from)]">{clampedProgress.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-[var(--button-gradient-from)] h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;