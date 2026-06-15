import React from 'react';

export interface DepartmentCardProps {
  name: string;
  staffCount: number;
  queueCount: number;
  status: 'success' | 'warning' | 'error';
  alerts: number;
  occupancy?: number;
  onViewClick?: () => void;
}

// Renders visual operational operational cards for clinical departments
export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  name,
  staffCount,
  queueCount,
  status,
  alerts,
  occupancy,
  onViewClick
}) => {
  // Configures status bulb colors based on operational status
  const getStatusColor = () => {
    switch (status) {
      case 'error':
        return 'bg-error';
      case 'warning':
        return 'bg-warning';
      default:
        return 'bg-success';
    }
  };

  return (
    <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col gap-md">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-xs">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <h4 className="font-headline-sm text-on-surface text-base font-semibold">
            {name}
          </h4>
        </div>
        
        {/* Render alerts count badges or dynamic actions */}
        {alerts > 0 ? (
          <span className={`px-2 py-[2px] font-label-sm rounded text-[10px] font-bold uppercase ${
            status === 'error' ? 'bg-error text-white' : 'bg-warning text-on-surface'
          }`}>
            {alerts} {alerts === 1 ? 'Alert' : 'Alerts'}
          </span>
        ) : (
          <button
            onClick={onViewClick}
            className="font-label-md text-primary text-xs font-semibold hover:underline"
          >
            View
          </button>
        )}
      </div>
      
      {/* Telemetry data summary details */}
      <div className="flex gap-md font-body-sm text-on-surface-variant text-xs">
        <span>Staff: {staffCount}</span>
        {occupancy !== undefined ? (
          <span>Occupancy: {occupancy}%</span>
        ) : (
          <span>Queue: {queueCount}</span>
        )}
      </div>
    </div>
  );
};
