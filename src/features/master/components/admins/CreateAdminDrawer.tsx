import { useState } from 'react'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'

interface CreateAdminDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (username: string) => void
}

export function CreateAdminDrawer({ isOpen, onClose, onSuccess }: CreateAdminDrawerProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await masterService.createMasterAdmin({
        username,
        password,
        email,
        full_name: fullName || undefined
      })
      toast.success(`Platform administrator "${username}" created!`)
      onSuccess(username)

      // Reset form
      setUsername('')
      setPassword('')
      setEmail('')
      setFullName('')
    } catch (err: any) {
      let errorMessage = 'Failed to create platform administrator.'
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail
            .map((e: any) => {
              const field = e.loc ? e.loc[e.loc.length - 1] : 'field'
              return `${field}: ${e.msg}`
            })
            .join(', ')
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail
        }
      }
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 opacity-100 pointer-events-auto"
        onClick={onClose} 
      />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col translate-x-0">
        <div className="p-lg border-0 border-b border-solid border-outline-variant flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface m-0 font-semibold">
            Create Platform Admin
          </h2>
          <button 
            type="button"
            className="text-secondary hover:text-on-surface p-1 rounded-full bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-surface-container"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden m-0">
          <div className="flex-1 overflow-y-auto p-lg space-y-md">
            
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-secondary m-0">Username *</label>
              <input
                type="text"
                className="w-full px-sm py-2 rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-white"
                required
                placeholder="e.g. superadmin_jack"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-secondary m-0">Password *</label>
              <input
                type="password"
                className="w-full px-sm py-2 rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-white"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-secondary m-0">Email Address *</label>
              <input
                type="email"
                className="w-full px-sm py-2 rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-white"
                required
                placeholder="e.g. jack@hospitalsystem.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-secondary m-0">Full Name</label>
              <input
                type="text"
                className="w-full px-sm py-2 rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-white"
                placeholder="e.g. Jack Sparrow"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

          </div>
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
              {submitting ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
