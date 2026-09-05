import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: React.ReactNode;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'amber' | 'emerald' | 'blue';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  barClassName?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant,
  size,
  className = '',
  barClassName = '',
  animated = false,
}) => {
  const safeMax = max > 0 ? max : 100;
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 font-mono text-xs uppercase tracking-wider text-stone-900">
          {label && <span>{label}</span>}
          {showPercentage && <span className="ml-auto font-bold">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        className="w-full border border-stone-200 bg-stone-100 h-2 sm:h-2.5 overflow-hidden"
      >
        <div
          className={`${barClassName || (percentage === 100 ? 'bg-emerald-600' : 'bg-stone-900')} h-full transition-all duration-150`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

