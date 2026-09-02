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

const variantStyles: Record<string, string> = {
  primary: 'bg-indigo-600 dark:bg-indigo-500',
  success: 'bg-emerald-500 dark:bg-emerald-400',
  emerald: 'bg-emerald-500 dark:bg-emerald-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  amber: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-rose-500 dark:bg-rose-400',
  purple: 'bg-purple-600 dark:bg-purple-500',
  blue: 'bg-blue-600 dark:bg-blue-500',
};

const sizeStyles: Record<string, string> = {
  xs: 'h-1.5',
  sm: 'h-2.5',
  md: 'h-3.5',
  lg: 'h-5',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant = 'primary',
  size = 'md',
  className = '',
  barClassName = '',
  animated = false,
}) => {
  const safeMax = max > 0 ? max : 100;
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));
  const barColor = variantStyles[variant] || variantStyles.primary;
  const barHeight = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showPercentage && <span className="ml-auto text-xs font-semibold text-slate-500 dark:text-slate-400">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        className={`w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/60 ${barHeight}`}
      >
        <div
          className={`${barHeight} rounded-full transition-all duration-500 ease-out ${barColor} ${
            animated ? 'animate-pulse' : ''
          } ${barClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
