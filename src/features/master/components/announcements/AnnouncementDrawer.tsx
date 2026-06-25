import React from 'react'
import type { Tenant } from '@/api/types/master'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  editingId: string | null
  title: string
  setTitle: (val: string) => void
  body: string
  setBody: (val: string) => void
  audience: 'all' | 'selected'
  setAudience: (val: 'all' | 'selected') => void
  tenants: Tenant[]
  targetTenantIds: string[]
  setTargetTenantIds: (val: string[]) => void
  publishAt: string
  setPublishAt: (val: string) => void
  expiresAt: string
  setExpiresAt: (val: string) => void
}

export function AnnouncementDrawer({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  editingId,
  title,
  setTitle,
  body,
  setBody,
  audience,
  setAudience,
  tenants,
  targetTenantIds,
  setTargetTenantIds,
  publishAt,
  setPublishAt,
  expiresAt,
  setExpiresAt
}: Props) {
  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 opacity-100 pointer-events-auto"
        onClick={onClose} 
      />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col translate-x-0">
        <div className="p-lg border-0 border-b border-solid border-outline-variant flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface m-0">
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </h2>
          <button 
            type="button"
            className="text-secondary hover:text-on-surface p-1 rounded-full bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-surface-container"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="flex-1 overflow-y-auto p-lg space-y-md">
            {/* Announcement Title */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-secondary m-0">Announcement Title *</label>
              <input 
                type="text"
                className="w-full px-sm py-2 rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-white"
                placeholder="e.g. System upgrade notification"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Broadcast Message Body */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-secondary m-0">Broadcast Message / Content *</label>
              <textarea 
                className="w-full px-sm py-2 rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-white"
                placeholder="Enter the details of the announcement notice..."
                required
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* Target Audience */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-secondary m-0">Target Audience *</label>
              <div className="grid grid-cols-2 gap-sm">
                <label className={`flex items-center justify-center gap-2 border border-solid rounded-lg p-sm cursor-pointer transition-colors ${audience === 'all' ? 'border-primary-container bg-primary/5 text-primary' : 'border-outline-variant hover:border-primary-container bg-transparent text-secondary'}`}>
                  <input 
                    type="radio" 
                    name="audience" 
                    checked={audience === 'all'} 
                    onChange={() => setAudience('all')}
                    className="text-primary focus:ring-primary h-4 w-4 border-outline-variant cursor-pointer"
                  />
                  <span className="font-body-sm text-body-sm font-medium">All Tenants</span>
                </label>
                <label className={`flex items-center justify-center gap-2 border border-solid rounded-lg p-sm cursor-pointer transition-colors ${audience === 'selected' ? 'border-primary-container bg-primary/5 text-primary' : 'border-outline-variant hover:border-primary-container bg-transparent text-secondary'}`}>
                  <input 
                    type="radio" 
                    name="audience" 
                    checked={audience === 'selected'} 
                    onChange={() => setAudience('selected')}
                    className="text-primary focus:ring-primary h-4 w-4 border-outline-variant cursor-pointer"
                  />
                  <span className="font-body-sm text-body-sm font-medium">Selected Tenants</span>
                </label>
              </div>
            </div>

            {/* Tenants Multi-select list */}
            {audience === 'selected' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-secondary m-0">Select Hospitals / Tenants *</label>
                <div className="border border-solid border-outline-variant rounded-lg p-sm bg-surface-container-lowest max-h-40 overflow-y-auto space-y-1">
                  {tenants.length === 0 ? (
                    <div className="text-xs text-secondary py-1 text-center">No tenants registered.</div>
                  ) : (
                    tenants.map((t) => (
                      <label key={t.tenant_id} className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low p-1.5 rounded transition-colors">
                        <input 
                          type="checkbox"
                          checked={targetTenantIds.includes(t.tenant_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetTenantIds([...targetTenantIds, t.tenant_id])
                            } else {
                              setTargetTenantIds(targetTenantIds.filter(id => id !== t.tenant_id))
                            }
                          }}
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-body-sm text-on-surface select-none font-medium">{t.hospital_name || t.name || t.tenant_id}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Date-time window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-secondary m-0">Publish Date & Time *</label>
                <input 
                  type="datetime-local"
                  required
                  className="w-full px-sm py-2 rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-white"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-secondary m-0">Expiry Date & Time (Optional)</label>
                <input 
                  type="datetime-local"
                  className="w-full px-sm py-2 rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-white"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="p-lg border-0 border-t border-solid border-outline-variant bg-surface-bright flex gap-md justify-end">
            <button 
              type="button" 
              className="bg-transparent border border-solid border-outline-variant text-secondary hover:bg-surface-container px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-primary text-white border-0 hover:bg-on-primary-fixed-variant px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Broadcasting...' : editingId ? 'Update Notice' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
