import type { ImagingScheduleAppointment, ScheduleModality } from '@/features/radiology/types/radiology'
import {
  SCHEDULE_END_HOUR,
  SCHEDULE_ROW_HEIGHT_PX,
  SCHEDULE_START_HOUR,
} from '@/features/radiology/data/mockImagingSchedule'
export const SCHEDULE_MODALITY_COLORS: Record<
  ScheduleModality,
  { bg: string; label: string; dot: string }
> = {
  'x-ray': { bg: 'bg-primary-container', label: 'X-Ray', dot: 'bg-primary-container' },
  'ct-scan': { bg: 'bg-[#6554C0]', label: 'CT', dot: 'bg-[#6554C0]' },
  mri: { bg: 'bg-secondary', label: 'MRI', dot: 'bg-secondary' },
  ultrasound: { bg: 'bg-info', label: 'Ultrasound', dot: 'bg-info' },
}

export function formatAppointmentModalityLine(appointment: ImagingScheduleAppointment): string {
  const modality = SCHEDULE_MODALITY_COLORS[appointment.modality].label.toUpperCase()
  return `${modality} • ${appointment.bodyPart.toUpperCase()}`
}

export function formatAppointmentDateTime(
  appointment: ImagingScheduleAppointment,
  weekDays: { date: number; month: number; year: number }[],
): string {
  const day = weekDays[appointment.dayIndex]
  const monthName = new Date(day.year, day.month, day.date).toLocaleString('en-US', {
    month: 'long',
  })
  const hour = appointment.startHour % 12 || 12
  const meridiem = appointment.startHour >= 12 ? 'PM' : 'AM'
  const minute = appointment.startMinute.toString().padStart(2, '0')
  return `${monthName} ${day.date}, ${hour}:${minute} ${meridiem}`
}

export function getAppointmentTopPx(appointment: ImagingScheduleAppointment): number {
  const hoursFromStart = appointment.startHour - SCHEDULE_START_HOUR
  const minutesOffset = appointment.startMinute / 60
  return Math.round((hoursFromStart + minutesOffset) * SCHEDULE_ROW_HEIGHT_PX + 8)
}

export function getAppointmentHeightPx(appointment: ImagingScheduleAppointment): number {
  return Math.max(Math.round((appointment.durationMinutes / 60) * SCHEDULE_ROW_HEIGHT_PX - 8), 48)
}

export function formatScheduleHours(): string[] {
  const hours: string[] = []
  for (let h = SCHEDULE_START_HOUR; h <= SCHEDULE_END_HOUR; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`)
  }
  return hours
}
