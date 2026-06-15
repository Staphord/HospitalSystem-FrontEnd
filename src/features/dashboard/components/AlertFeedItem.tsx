import React from 'react';

export interface AlertFeedItemProps {
  severity: 'critical' | 'warning' | 'info';
  department: string;
  message: string;
  timestamp: string;
}

// Renders log notification items within active alert widgets
export const AlertFeedItem: React.FC<AlertFeedItemProps> = ({
  severity,
  department,
  message,
  timestamp
}) => {
  // Maps severity level flags to styling badges
  const getSeverityBadge = () => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-1 bg-error text-white font-label-sm text-[10px] font-bold rounded uppercase">
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-1 bg-warning text-on-surface font-label-sm text-[10px] font-bold rounded uppercase">
            Warning
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-row-hover text-primary font-label-sm text-[10px] font-bold rounded uppercase">
            Info
          </span>
        );
    }
  };

  return (
    <div className="p-md flex items-start gap-md border-b border-border-subtle last:border-b-0 hover:bg-surface-container-lowest transition-colors">
      {getSeverityBadge()}
      <div className="flex-1">
        <p className="font-body-md font-semibold text-on-surface text-sm">
          {department}
        </p>
        <p className="font-body-sm text-on-surface-variant text-xs mt-0.5">
          {message}
        </p>
      </div>
      <span className="font-body-sm text-outline text-xs whitespace-nowrap shrink-0">
        {timestamp}
      </span>
    </div>
  );
};
