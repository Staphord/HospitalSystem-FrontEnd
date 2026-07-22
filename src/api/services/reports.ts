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
  getDashboard: () =>
    apiClient.get('/reports/dashboard').then((r) => r.data),

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
    apiClient.get('/reports/discharge-statistics', { params }).then((r) => r.data),
}
