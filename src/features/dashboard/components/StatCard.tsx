import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: string;
  trend?: 'up' | 'down' | 'flat' | 'none';
}

// Renders individual telemetry metric cards on dashboards
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon,
  trend = 'none'
}) => {
  // Selects appropriate trend icons and styles
  const renderTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <span className="material-symbols-outlined text-success" aria-label="Trending up">
            trending_up
          </span>
        );
      case 'down':
        return (
          <span className="material-symbols-outlined text-error" aria-label="Trending down">
            trending_down
          </span>
        );
      case 'flat':
        return (
          <span className="material-symbols-outlined text-warning" aria-label="Trending flat">
            trending_flat
          </span>
        );
      default:
        return (
          <span className="material-symbols-outlined text-outline" aria-label="No trend change">
            horizontal_rule
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between min-h-[100px]">
      <span className="font-label-md text-outline uppercase tracking-wide text-xs">
        {title}
      </span>
      <div className="flex items-end justify-between mt-sm">
        <span className="font-headline-lg text-on-surface text-2xl font-bold">
          {value}
          {subValue && (
            <span className="text-outline text-sm font-normal ml-0.5">
              {subValue}
            </span>
          )}
        </span>
        <span className="w-6 h-6 flex items-center justify-center shrink-0">
          {icon ? <span className="material-symbols-outlined text-secondary">{icon}</span> : renderTrendIcon()}
        </span>
      </div>
    </div>
  );
};
