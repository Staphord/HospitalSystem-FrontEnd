import { apiClient } from '@/api/client'
import type {
  BedOccupancyReport,
  PatientCensusReport,
  ReportParams,
  RevenueSummaryReport,
  WaitTimeReport,
} from '@/api/types/reports'

// All paths proxied via api-gateway → report-service
export const reportsService = {
  getPatientCensus: (params?: ReportParams) =>
    apiClient
      .get<PatientCensusReport>('/reports/patient-census', { params })
      .then((r) => r.data),

  getRevenueSummary: (params?: ReportParams) =>
    apiClient
      .get<RevenueSummaryReport>('/reports/revenue-summary', { params })
      .then((r) => r.data),

  getWaitTimes: (params?: ReportParams) =>
    apiClient
      .get<WaitTimeReport[]>('/reports/wait-times', { params })
      .then((r) => r.data),

  getBedOccupancy: (params?: ReportParams) =>
    apiClient
      .get<BedOccupancyReport>('/reports/bed-occupancy', { params })
      .then((r) => r.data),

  getDischargeStats: (params?: ReportParams) =>
    apiClient.get('/reports/discharge-stats', { params }).then((r) => r.data),

  getLabTurnaround: (params?: ReportParams) =>
    apiClient.get('/reports/lab-turnaround', { params }).then((r) => r.data),

  getOutstandingBills: (params?: ReportParams) =>
    apiClient.get('/reports/outstanding-bills', { params }).then((r) => r.data),
}
