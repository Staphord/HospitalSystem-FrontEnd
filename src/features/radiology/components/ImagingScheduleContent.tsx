import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { IMAGING_SCHEDULE_APPOINTMENTS } from '@/features/radiology/data/mockImagingSchedule'
import { getImagingRequestById } from '@/features/radiology/utils/imagingRequestStore'
import {
  formatAppointmentDateTime,
  formatAppointmentModalityLine,
  formatScheduleHours,
  getAppointmentHeightPx,
  getAppointmentTopPx,
  SCHEDULE_MODALITY_COLORS,
} from '@/features/radiology/utils/imagingScheduleUtils'
import type { ImagingScheduleAppointment, ScheduleWeekDay } from '@/features/radiology/types/radiology'

type ViewMode = 'calendar' | 'list'

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function computeWeekDays(weekOffset: number): ScheduleWeekDay[] {
  const today = new Date()
  const dow = today.getDay()
  const mondayDelta = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayDelta + weekOffset * 7)

  return DAY_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      label,
      date: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      isToday: d.toDateString() === today.toDateString(),
    }
  })
}

function computeWeekLabel(days: ScheduleWeekDay[]): string {
  const first = days[0]
  const last = days[4]
  const fm = MONTH_SHORT[(first.month ?? 1) - 1]
  const lm = MONTH_SHORT[(last.month ?? 1) - 1]
  if (first.month === last.month) {
    return `${fm} ${first.date} — ${last.date}, ${first.year}`
  }
  return `${fm} ${first.date} — ${lm} ${last.date}, ${last.year}`
}

function ModalityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-lg">
      {(Object.keys(SCHEDULE_MODALITY_COLORS) as Array<keyof typeof SCHEDULE_MODALITY_COLORS>).map(
        (key) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${SCHEDULE_MODALITY_COLORS[key].dot}`} />
            <span className="text-label-sm text-secondary">{SCHEDULE_MODALITY_COLORS[key].label}</span>
          </div>
        ),
      )}
    </div>
  )
}

function AppointmentBlock({
  appointment,
  onSelect,
}: {
  appointment: ImagingScheduleAppointment
  onSelect: (appointment: ImagingScheduleAppointment) => void
}) {
  const colors = SCHEDULE_MODALITY_COLORS[appointment.modality]
  return (
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      className={`absolute left-1.5 right-1.5 text-white rounded-lg px-2.5 py-2 shadow hover:brightness-110 transition-all text-left border-0 cursor-pointer ${colors.bg}`}
      style={{ top: getAppointmentTopPx(appointment), height: getAppointmentHeightPx(appointment) }}
    >
      <div className="text-label-md font-bold truncate leading-tight">{appointment.patientName}</div>
      <div className="text-[10px] opacity-80 uppercase font-black tracking-widest mt-0.5 leading-tight truncate">
        {formatAppointmentModalityLine(appointment)}
      </div>
    </button>
  )
}

function AppointmentDetailModal({
  appointment,
  weekDays,
  onClose,
  onCheckIn,
}: {
  appointment: ImagingScheduleAppointment | null
  weekDays: ScheduleWeekDay[]
  onClose: () => void
  onCheckIn: (appointment: ImagingScheduleAppointment) => void
}) {
  if (!appointment) return null
  const modalityColors = SCHEDULE_MODALITY_COLORS[appointment.modality]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white w-full max-w-sm rounded-xl shadow-2xl border border-border-subtle overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-lg border-b border-border-subtle flex justify-between items-start bg-surface-container-low">
          <div>
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded mb-1 ${modalityColors.bg} text-white`}
            >
              {appointment.departmentLabel}
            </span>
            <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface m-0">
              {appointment.patientName}
            </h4>
            <p className="text-body-sm text-secondary m-0 mt-1">
              DOB: {appointment.dateOfBirth} ({appointment.age})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="material-symbols-outlined text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container border-0 bg-transparent cursor-pointer"
            aria-label="Close"
          >
            close
          </button>
        </div>
        <div className="p-lg space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <p className="text-label-sm font-semibold text-outline mb-1 uppercase tracking-tighter m-0">
                Date &amp; Time
              </p>
              <p className="text-body-sm font-bold text-on-surface m-0">
                {formatAppointmentDateTime(appointment, weekDays)}
              </p>
            </div>
            <div>
              <p className="text-label-sm font-semibold text-outline mb-1 uppercase tracking-tighter m-0">
                Duration
              </p>
              <p className="text-body-sm font-bold text-on-surface m-0">
                {appointment.durationMinutes} min
              </p>
            </div>
          </div>
          <div>
            <p className="text-label-sm font-semibold text-outline mb-1 uppercase tracking-tighter m-0">
              Clinical Indication
            </p>
            <p className="text-body-sm text-on-surface leading-relaxed m-0">
              {appointment.clinicalIndication}
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onCheckIn(appointment)}
              className="flex-1 h-10 bg-primary-container text-white rounded-lg text-label-md font-bold hover:bg-primary transition-all shadow-sm border-0 cursor-pointer"
            >
              Check-in Patient
            </button>
            <button
              type="button"
              onClick={() => toast.info('Edit appointment coming soon.')}
              className="w-10 h-10 border border-border-subtle rounded-lg flex items-center justify-center hover:bg-surface-container-high transition-colors bg-white cursor-pointer"
              aria-label="Edit"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AddModalProps {
  open: boolean
  prefillPatientName?: string
  prefillPatientNumber?: string
  prefillModality?: string
  prefillNotes?: string
  prefillRequestId?: string
  weekDays: ScheduleWeekDay[]
  onClose: () => void
  onSave: (appt: ImagingScheduleAppointment) => void
}

function AddAppointmentModal({
  open,
  prefillPatientName = '',
  prefillPatientNumber = '',
  prefillModality = 'x-ray',
  prefillNotes = '',
  prefillRequestId,
  weekDays,
  onClose,
  onSave,
}: AddModalProps) {
  const [patientName, setPatientName] = useState(prefillPatientName)
  const [modality, setModality] = useState(prefillModality)
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState(prefillNotes)

  useEffect(() => {
    if (open) {
      setPatientName(prefillPatientName)
      setModality(prefillModality)
      setNotes(prefillNotes)
    }
  }, [open, prefillPatientName, prefillModality, prefillNotes])

  if (!open) return null

  const MODALITY_MAP: Record<string, ImagingScheduleAppointment['modality']> = {
    'x-ray': 'x-ray',
    'ct-scan': 'ct-scan',
    mri: 'mri',
    ultrasound: 'ultrasound',
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientName.trim() || !date || !time) {
      toast.error('Please fill in patient, date and time.')
      return
    }
    const [h, m] = time.split(':').map(Number)
    // Map picked date to dayIndex within current week (clamp to 0-4)
    const picked = new Date(date)
    const monday = new Date(weekDays[0].year, weekDays[0].month - 1, weekDays[0].date)
    const diff = Math.floor((picked.getTime() - monday.getTime()) / 86400000)
    const dayIndex = Math.min(Math.max(diff, 0), 4)

    const newAppt: ImagingScheduleAppointment = {
      id: `appt-${Date.now()}`,
      patientName: patientName.trim(),
      dateOfBirth: '—',
      age: '—',
      modality: MODALITY_MAP[modality] ?? 'x-ray',
      bodyPart: '—',
      departmentLabel: `${(MODALITY_MAP[modality] ?? 'x-ray').toUpperCase()} Dept`,
      dayIndex,
      startHour: h ?? 8,
      startMinute: m ?? 0,
      durationMinutes: 30,
      clinicalIndication: notes.trim() || 'Scheduled from Imaging Requests.',
      priority,
      requestId: prefillRequestId,
    }
    onSave(newAppt)
    toast.success(`Appointment scheduled for ${patientName.trim()}.`)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-md p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white w-full max-w-xl rounded-2xl shadow-2xl border border-border-subtle overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-lg border-b border-border-subtle flex justify-between items-center bg-surface-container-low">
          <h3 className="font-headline-md text-headline-md font-bold text-primary m-0">
            New Imaging Appointment
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="material-symbols-outlined text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container border-0 bg-transparent cursor-pointer"
            aria-label="Close"
          >
            close
          </button>
        </div>
        <form className="p-lg space-y-lg" onSubmit={handleSubmit}>
          {prefillPatientNumber && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="material-symbols-outlined text-primary text-[18px]">link</span>
              <span className="text-label-md text-primary font-semibold">
                Linked to request {prefillPatientNumber}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-lg">
            <div className="col-span-2">
              <label className="block text-label-md font-bold text-on-surface mb-2">Patient Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  person_search
                </span>
                <input
                  className="w-full pl-10 border border-border-subtle rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 bg-surface-white"
                  placeholder="Enter patient name or ID..."
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-2">Modality</label>
              <select
                className="w-full border border-border-subtle rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 bg-surface-white"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
              >
                <option value="x-ray">X-Ray</option>
                <option value="ct-scan">CT Scan</option>
                <option value="mri">MRI</option>
                <option value="ultrasound">Ultrasound</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-2">Priority</label>
              <select
                className="w-full border border-border-subtle rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 bg-surface-white"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'routine' | 'urgent' | 'stat')}
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT (Immediate)</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-2">Date</label>
              <input
                className="w-full border border-border-subtle rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 bg-surface-white"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-2">Time</label>
              <input
                className="w-full border border-border-subtle rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 bg-surface-white"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-label-md font-bold text-on-surface mb-2">
                Clinical Notes &amp; Indications
              </label>
              <textarea
                className="w-full border border-border-subtle rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 bg-surface-white"
                placeholder="Describe the reason for the exam and any specific clinical requirements..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-md pt-lg border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-lg h-11 rounded-lg text-secondary font-bold text-label-md hover:bg-surface-container-high transition-colors border border-border-subtle bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-xl h-11 bg-primary-container text-white rounded-lg font-bold text-label-md hover:bg-primary transition-all active:scale-[0.98] shadow-sm border-0 cursor-pointer"
            >
              Save Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ScheduleListView({
  appointments,
  weekDays,
  onSelect,
}: {
  appointments: ImagingScheduleAppointment[]
  weekDays: ScheduleWeekDay[]
  onSelect: (appointment: ImagingScheduleAppointment) => void
}) {
  const sorted = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex
        if (a.startHour !== b.startHour) return a.startHour - b.startHour
        return a.startMinute - b.startMinute
      }),
    [appointments],
  )

  return (
    <div className="flex-1 min-h-0 bg-surface-white border border-border-subtle rounded-xl overflow-hidden flex flex-col">
      <div className="overflow-y-auto divide-y divide-border-subtle">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-secondary gap-2">
            <span className="material-symbols-outlined text-4xl">event_busy</span>
            <p className="text-body-md m-0">No appointments this week.</p>
          </div>
        )}
        {sorted.map((appointment) => {
          const colors = SCHEDULE_MODALITY_COLORS[appointment.modality]
          const day = weekDays[appointment.dayIndex]
          return (
            <button
              key={appointment.id}
              type="button"
              onClick={() => onSelect(appointment)}
              className="w-full p-lg flex items-center justify-between gap-md hover:bg-surface-container-low transition-colors text-left border-0 bg-transparent cursor-pointer"
            >
              <div className="flex items-center gap-md min-w-0">
                <div className={`w-1.5 h-12 rounded-full shrink-0 ${colors.bg}`} />
                <div className="min-w-0">
                  <p className="font-body-md font-semibold text-on-surface m-0 truncate">
                    {appointment.patientName}
                  </p>
                  <p className="text-label-sm text-secondary m-0 mt-1">
                    {day ? `${day.label} ${day.date}` : '—'} •{' '}
                    {formatAppointmentDateTime(appointment, weekDays)} • {appointment.durationMinutes} min
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-label-sm font-bold text-white shrink-0 ${colors.bg}`}>
                {formatAppointmentModalityLine(appointment)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ScheduleCalendarView({
  appointments,
  weekDays,
  weekLabel,
  selectedDayIndex,
  onSelectDay,
  onSelectAppointment,
  onPrevWeek,
  onNextWeek,
  onToday,
}: {
  appointments: ImagingScheduleAppointment[]
  weekDays: ScheduleWeekDay[]
  weekLabel: string
  selectedDayIndex: number | null
  onSelectDay: (i: number) => void
  onSelectAppointment: (a: ImagingScheduleAppointment) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}) {
  const hours = formatScheduleHours()
  const appointmentsByDay = useMemo(() => {
    const map: ImagingScheduleAppointment[][] = [[], [], [], [], []]
    appointments.forEach((appt) => {
      map[appt.dayIndex]?.push(appt)
    })
    return map
  }, [appointments])

  return (
    <div className="flex-1 min-h-0 bg-surface-white border border-border-subtle rounded-xl overflow-hidden flex flex-col shadow-sm">
      {/* Calendar toolbar */}
      <div className="px-lg py-3 border-b border-border-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-md bg-surface-container-low shrink-0">
        <div className="flex flex-wrap items-center gap-md">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevWeek}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle bg-surface-white hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Previous week"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle bg-surface-white hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Next week"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onToday}
            className="px-3 h-8 text-label-md font-semibold border border-border-subtle bg-surface-white rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Today
          </button>
          <span className="text-body-md text-on-surface font-semibold">{weekLabel}</span>
        </div>
        <ModalityLegend />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col min-h-[480px]">
        {/* Day header row */}
        <div
          className="grid border-b border-border-subtle bg-surface-container-low sticky top-0 z-30"
          style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}
        >
          <div className="border-r border-border-subtle" />
          {weekDays.map((day, i) => (
            <button
              key={day.label}
              type="button"
              onClick={() => onSelectDay(i)}
              className={`py-3 border-r border-border-subtle last:border-r-0 text-center transition-colors cursor-pointer border-0 bg-transparent ${
                day.isToday ? 'bg-primary/5' : selectedDayIndex === i ? 'bg-surface-container' : ''
              }`}
            >
              <div
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                  day.isToday ? 'text-primary' : 'text-secondary'
                }`}
              >
                {day.label}
              </div>
              <div
                className={`text-[22px] font-extrabold leading-none ${
                  day.isToday
                    ? 'text-white bg-primary w-9 h-9 rounded-full flex items-center justify-center mx-auto'
                    : selectedDayIndex === i
                      ? 'text-primary'
                      : 'text-on-surface'
                }`}
              >
                {day.date}
              </div>
            </button>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative flex-1">
          <div style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }} className="grid">
            {hours.map((timeLabel, hIdx) => (
              <div key={timeLabel} className="contents">
                {/* Hour label */}
                <div className="h-24 border-r border-border-subtle flex items-start justify-end pr-3 pt-2">
                  <span className="text-[11px] font-semibold text-outline select-none">
                    {hIdx === 0 ? '' : timeLabel}
                  </span>
                </div>
                {/* Day cells */}
                {weekDays.map((day, dayIdx) => (
                  <div
                    key={`${timeLabel}-${day.label}`}
                    className={`h-24 border-b border-border-subtle relative ${
                      dayIdx < weekDays.length - 1 ? 'border-r' : ''
                    } ${
                      day.isToday
                        ? 'bg-primary/[0.025]'
                        : selectedDayIndex === dayIdx
                          ? 'bg-surface-container-low/50'
                          : ''
                    }`}
                  >
                    {/* Subtle half-hour line */}
                    <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border-subtle/50" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Appointment blocks overlay */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div
              className="grid h-full w-full"
              style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}
            >
              <div />
              {weekDays.map((day, dayIdx) => (
                <div key={day.label} className="relative h-full">
                  {appointmentsByDay[dayIdx]?.map((appointment) => (
                    <div key={appointment.id} className="pointer-events-auto">
                      <AppointmentBlock appointment={appointment} onSelect={onSelectAppointment} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ImagingScheduleContent() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [appointments, setAppointments] = useState<ImagingScheduleAppointment[]>(
    IMAGING_SCHEDULE_APPOINTMENTS,
  )
  const [selectedAppointment, setSelectedAppointment] = useState<ImagingScheduleAppointment | null>(
    null,
  )
  const [addModalOpen, setAddModalOpen] = useState(false)

  const weekDays = useMemo(() => computeWeekDays(weekOffset), [weekOffset])
  const weekLabel = useMemo(() => computeWeekLabel(weekDays), [weekDays])

  const prefillRequestId = searchParams.get('prefill') ?? undefined
  const prefillRequest = prefillRequestId ? getImagingRequestById(prefillRequestId) : undefined

  useEffect(() => {
    if (prefillRequestId) setAddModalOpen(true)
  }, [prefillRequestId])

  const handleCloseAddModal = () => {
    setAddModalOpen(false)
    if (prefillRequestId) setSearchParams({}, { replace: true })
  }

  const handleSaveAppointment = (appt: ImagingScheduleAppointment) => {
    setAppointments((prev) => [...prev, appt])
  }

  const handleCheckIn = (appointment: ImagingScheduleAppointment) => {
    setSelectedAppointment(null)
    if (appointment.requestId) {
      toast.success(`Checking in ${appointment.patientName}`)
      navigate(`/radiology/requests/${appointment.requestId}/report`)
      return
    }
    toast.success(`${appointment.patientName} checked in. Create a report from Imaging Requests.`)
  }

  return (
    <div className="max-w-container-max mx-auto w-full h-full flex flex-col gap-lg min-h-0">
      {/* Top bar: view switcher + add button */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex bg-surface-container rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-md text-label-md font-semibold flex items-center gap-2 transition-colors border-0 cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-surface-white shadow-sm text-primary'
                : 'text-secondary hover:text-primary bg-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-md text-label-md font-medium flex items-center gap-2 transition-colors border-0 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-surface-white shadow-sm text-primary font-semibold'
                : 'text-secondary hover:text-primary bg-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">view_list</span>
            List
          </button>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="bg-primary-container text-white h-10 px-lg rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-primary transition-colors active:scale-95 shadow-sm border-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Appointment
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <ScheduleCalendarView
          appointments={appointments}
          weekDays={weekDays}
          weekLabel={weekLabel}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={(i) => setSelectedDayIndex((prev) => (prev === i ? null : i))}
          onSelectAppointment={setSelectedAppointment}
          onPrevWeek={() => setWeekOffset((o) => o - 1)}
          onNextWeek={() => setWeekOffset((o) => o + 1)}
          onToday={() => { setWeekOffset(0); setSelectedDayIndex(null) }}
        />
      ) : (
        <ScheduleListView
          appointments={appointments}
          weekDays={weekDays}
          onSelect={setSelectedAppointment}
        />
      )}

      <AppointmentDetailModal
        appointment={selectedAppointment}
        weekDays={weekDays}
        onClose={() => setSelectedAppointment(null)}
        onCheckIn={handleCheckIn}
      />
      <AddAppointmentModal
        open={addModalOpen}
        prefillPatientName={prefillRequest?.patientName}
        prefillPatientNumber={prefillRequest?.patientNumber}
        prefillModality={prefillRequest?.modality}
        prefillNotes={prefillRequest?.clinicalIndication}
        prefillRequestId={prefillRequestId}
        weekDays={weekDays}
        onClose={handleCloseAddModal}
        onSave={handleSaveAppointment}
      />
    </div>
  )
}
