// report-service — analytics and dashboards

export interface ReportParams {
  start_date?: string
  end_date?: string
}

export interface PatientCensusReport {
  total_patients: number
  new_registrations: number
  active_visits: number
}

export interface RevenueSummaryReport {
  total_revenue: number
  outstanding_balance: number
  payments_received: number
}

export interface WaitTimeReport {
  department: string
  average_wait_minutes: number
}

export interface BedOccupancyReport {
  total_beds: number
  occupied_beds: number
  occupancy_rate: number
}
