import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { wardService } from '@/api/services/ward'
import type { Admission, WardBed } from '@/api/types/ward'

function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function shortId(id: string) {
  return id.slice(0, 8)
}

export function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [beds, setBeds] = useState<WardBed[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'active' | 'discharged' | 'all'>('active')
  const [isAdmitOpen, setIsAdmitOpen] = useState(false)
  const [isDischargeOpen, setIsDischargeOpen] = useState<Admission | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [visitId, setVisitId] = useState('')
  const [bedId, setBedId] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('')
  const [dischargeInstructions, setDischargeInstructions] = useState('')

  const load = () => {
    setLoading(true)
    const params =
      statusFilter === 'all' ? { limit: 200 } : { status: statusFilter, limit: 200 }
    Promise.all([
      wardService.listAdmissions(params),
      wardService.listBeds({ is_available: true, is_active: true }),
    ])
      .then(([adm, availableBeds]) => {
        setAdmissions(adm)
        setBeds(availableBeds)
        if (!bedId && availableBeds[0]) setBedId(availableBeds[0].bedId)
      })
      .catch((err) => {
        console.error(err)
        toast.error(err.response?.data?.detail || 'Failed to load admissions.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitId.trim() || !bedId || !diagnosis.trim() || submitting) return
    setSubmitting(true)
    wardService
      .createAdmission({
        visitId: visitId.trim(),
        bedId,
        admittingDiagnosis: diagnosis.trim(),
      })
      .then(() => {
        toast.success('Patient admitted.')
        setIsAdmitOpen(false)
        setVisitId('')
        setDiagnosis('')
        load()
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Admission failed.')
      })
      .finally(() => setSubmitting(false))
  }

  const handleDischarge = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDischargeOpen || !dischargeDiagnosis.trim() || submitting) return
    setSubmitting(true)
    wardService
      .dischargeAdmission(isDischargeOpen.admissionId, {
        dischargeDiagnosis: dischargeDiagnosis.trim(),
        dischargeInstructions: dischargeInstructions.trim() || undefined,
      })
      .then(() => {
        toast.success('Patient discharged.')
        setIsDischargeOpen(null)
        setDischargeDiagnosis('')
        setDischargeInstructions('')
        load()
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Discharge failed.')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="p-lg max-w-container-max mx-auto min-h-screen bg-neutral-bg space-y-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <nav className="flex items-center gap-xs text-secondary font-label-md text-[11px] uppercase tracking-wider mb-xs">
            <span>Ward</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Admissions</span>
          </nav>
          <h1 className="font-headline-md text-headline-md text-on-surface">Ward Admissions</h1>
          <p className="text-body-sm text-secondary mt-xs">
            Admit from a visit, track length of stay, and discharge inpatients.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="border border-border-subtle rounded-lg px-md py-sm bg-surface-white text-body-sm"
            aria-label="Filter by status"
          >
            <option value="active">Active</option>
            <option value="discharged">Discharged</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={() => setIsAdmitOpen(true)}
            className="bg-primary-container text-white px-md h-[40px] rounded-lg flex items-center gap-sm font-label-md border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Admission
          </button>
        </div>
      </div>

      <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-border-subtle">
                <th className="px-md py-sm font-label-md text-label-md text-outline uppercase">Patient</th>
                <th className="px-md py-sm font-label-md text-label-md text-outline uppercase">Bed / Ward</th>
                <th className="px-md py-sm font-label-md text-label-md text-outline uppercase">Diagnosis</th>
                <th className="px-md py-sm font-label-md text-label-md text-outline uppercase">Admitted</th>
                <th className="px-md py-sm font-label-md text-label-md text-outline uppercase">LOS</th>
                <th className="px-md py-sm font-label-md text-label-md text-outline uppercase">Status</th>
                <th className="px-md py-sm font-label-md text-label-md text-outline uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-md py-lg text-center text-secondary text-body-sm">
                    Loading admissions...
                  </td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-md py-lg text-center text-secondary text-body-sm">
                    No admissions found.
                  </td>
                </tr>
              ) : (
                admissions.map((adm) => (
                  <tr key={adm.admissionId} className="hover:bg-row-hover">
                    <td className="px-md py-md">
                      <div className="font-medium text-on-surface">Patient {shortId(adm.patientId)}</div>
                      <div className="text-label-sm text-secondary">Visit {shortId(adm.visitId)}</div>
                    </td>
                    <td className="px-md py-md text-body-sm text-on-surface">
                      {adm.bedNumber ? `Bed ${adm.bedNumber}` : shortId(adm.bedId)}
                      {adm.wardName ? (
                        <div className="text-label-sm text-secondary">{adm.wardName}</div>
                      ) : null}
                    </td>
                    <td className="px-md py-md text-body-sm text-on-surface max-w-[240px]">
                      {adm.admittingDiagnosis}
                    </td>
                    <td className="px-md py-md text-body-sm text-secondary">
                      {formatDate(adm.admissionDate)}
                    </td>
                    <td className="px-md py-md text-body-sm text-on-surface">
                      {adm.lengthOfStayDays != null ? `${adm.lengthOfStayDays} d` : '—'}
                    </td>
                    <td className="px-md py-md">
                      <span
                        className={`text-label-sm font-semibold px-sm py-1 rounded-full ${
                          adm.status === 'active'
                            ? 'bg-success/10 text-success'
                            : 'bg-surface-container text-secondary'
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-md py-md text-right space-x-sm">
                      <Link
                        to={`/ward/patients/${adm.admissionId}/notes`}
                        className="text-primary font-label-md text-label-md no-underline hover:underline"
                      >
                        Notes
                      </Link>
                      {adm.status === 'active' && (
                        <button
                          onClick={() => {
                            setIsDischargeOpen(adm)
                            setDischargeDiagnosis('')
                            setDischargeInstructions('')
                          }}
                          className="text-error font-label-md text-label-md bg-transparent border-0 cursor-pointer hover:underline"
                        >
                          Discharge
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-white w-full max-w-[480px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center">
              <h3 className="font-headline-sm text-[18px] font-semibold">New Admission</h3>
              <button
                onClick={() => setIsAdmitOpen(false)}
                className="bg-transparent border-0 cursor-pointer"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAdmit} className="px-lg py-lg space-y-md">
              <div className="space-y-xs">
                <label className="block font-label-md text-secondary">Visit ID</label>
                <input
                  required
                  value={visitId}
                  onChange={(e) => setVisitId(e.target.value)}
                  className="w-full border border-border-subtle rounded-lg px-md py-sm outline-none"
                  placeholder="UUID of an existing visit"
                />
              </div>
              <div className="space-y-xs">
                <label className="block font-label-md text-secondary">Available Bed</label>
                <select
                  required
                  value={bedId}
                  onChange={(e) => setBedId(e.target.value)}
                  className="w-full border border-border-subtle rounded-lg px-md py-sm outline-none bg-surface-white"
                >
                  {beds.length === 0 ? (
                    <option value="">No available beds</option>
                  ) : (
                    beds.map((b) => (
                      <option key={b.bedId} value={b.bedId}>
                        {b.wardName} — Bed {b.bedNumber} ({b.bedType})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-xs">
                <label className="block font-label-md text-secondary">Admitting Diagnosis</label>
                <textarea
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full border border-border-subtle rounded-lg px-md py-sm outline-none min-h-[88px]"
                  placeholder="Primary reason for admission"
                />
              </div>
              <div className="flex justify-end gap-md pt-sm">
                <button
                  type="button"
                  onClick={() => setIsAdmitOpen(false)}
                  className="px-lg py-sm rounded border border-border-subtle bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || beds.length === 0}
                  className="px-lg py-sm rounded bg-primary-container text-white border-0 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Admitting...' : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDischargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-white w-full max-w-[480px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center">
              <h3 className="font-headline-sm text-[18px] font-semibold">Discharge Patient</h3>
              <button
                onClick={() => setIsDischargeOpen(null)}
                className="bg-transparent border-0 cursor-pointer"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleDischarge} className="px-lg py-lg space-y-md">
              <p className="text-body-sm text-secondary">
                Discharging patient {shortId(isDischargeOpen.patientId)} from{' '}
                {isDischargeOpen.bedNumber
                  ? `Bed ${isDischargeOpen.bedNumber}`
                  : shortId(isDischargeOpen.bedId)}
                .
              </p>
              <div className="space-y-xs">
                <label className="block font-label-md text-secondary">Discharge Diagnosis</label>
                <textarea
                  required
                  value={dischargeDiagnosis}
                  onChange={(e) => setDischargeDiagnosis(e.target.value)}
                  className="w-full border border-border-subtle rounded-lg px-md py-sm outline-none min-h-[80px]"
                />
              </div>
              <div className="space-y-xs">
                <label className="block font-label-md text-secondary">Instructions (optional)</label>
                <textarea
                  value={dischargeInstructions}
                  onChange={(e) => setDischargeInstructions(e.target.value)}
                  className="w-full border border-border-subtle rounded-lg px-md py-sm outline-none min-h-[64px]"
                />
              </div>
              <div className="flex justify-end gap-md pt-sm">
                <button
                  type="button"
                  onClick={() => setIsDischargeOpen(null)}
                  className="px-lg py-sm rounded border border-border-subtle bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-lg py-sm rounded bg-error text-white border-0 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Discharging...' : 'Confirm Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
