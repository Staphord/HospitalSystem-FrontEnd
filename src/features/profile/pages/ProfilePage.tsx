import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { usersService, type UserUpdatePayload, type PasswordChangePayload } from '@/api/services/users'
import { useAuth } from '@/hooks/useAuth'

export function ProfilePage() {
  const { user, setUser } = useAuth()
  
  // Basic Info Form
  const { register: registerInfo, handleSubmit: handleInfoSubmit, formState: { errors: infoErrors }, reset } = useForm<UserUpdatePayload>()
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false)

  // Password Form
  const { register: registerPwd, handleSubmit: handlePwdSubmit, formState: { errors: pwdErrors }, reset: resetPwd, watch } = useForm<PasswordChangePayload & { confirm_password?: string }>()
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false)
  const newPwd = watch('new_password')

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        full_name: user.full_name || '',
      })
    }
  }, [user, reset])

  const onInfoSubmit = async (data: UserUpdatePayload) => {
    setIsUpdatingInfo(true)
    try {
      await usersService.updateMe(data)
      if (user) {
        setUser({ ...user, ...data })
      }
      toast.success('Profile information updated successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile information')
    } finally {
      setIsUpdatingInfo(false)
    }
  }

  const onPwdSubmit = async (data: PasswordChangePayload & { confirm_password?: string }) => {
    setIsUpdatingPwd(true)
    try {
      await usersService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('Password changed successfully')
      resetPwd()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setIsUpdatingPwd(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Personal Profile</h2>
          <p>Manage your account settings and security preferences.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="col-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Basic Information</h3>
            </div>
            <form onSubmit={handleInfoSubmit(onInfoSubmit)}>
              <div className="card-body">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    {...registerInfo('username', { required: 'Username is required' })}
                    className="form-control"
                    placeholder="Enter your username"
                  />
                  {infoErrors.username && <p className="text-sm text-danger" style={{ color: 'var(--color-error)' }}>{infoErrors.username.message}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    {...registerInfo('email', { required: 'Email is required' })}
                    className="form-control"
                    placeholder="Enter your email address"
                  />
                  {infoErrors.email && <p className="text-sm text-danger" style={{ color: 'var(--color-error)' }}>{infoErrors.email.message}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="full_name">Full Name</label>
                  <input
                    id="full_name"
                    type="text"
                    {...registerInfo('full_name')}
                    className="form-control"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              <div className="card-footer">
                <button
                  type="submit"
                  disabled={isUpdatingInfo}
                  className="btn btn-primary"
                >
                  {isUpdatingInfo ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Security Settings</h3>
            </div>
            <form onSubmit={handlePwdSubmit(onPwdSubmit)}>
              <div className="card-body">
                <div className="form-group">
                  <label htmlFor="current_password">Current Password</label>
                  <input
                    id="current_password"
                    type="password"
                    {...registerPwd('current_password', { required: 'Current password is required' })}
                    className="form-control"
                    placeholder="Enter your current password"
                  />
                  {pwdErrors.current_password && <p className="text-sm text-danger" style={{ color: 'var(--color-error)' }}>{pwdErrors.current_password.message}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="new_password">New Password</label>
                  <input
                    id="new_password"
                    type="password"
                    {...registerPwd('new_password', { 
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' }
                    })}
                    className="form-control"
                    placeholder="Enter a new password"
                  />
                  {pwdErrors.new_password && <p className="text-sm text-danger" style={{ color: 'var(--color-error)' }}>{pwdErrors.new_password.message}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm New Password</label>
                  <input
                    id="confirm_password"
                    type="password"
                    {...registerPwd('confirm_password', { 
                      required: 'Please confirm your new password',
                      validate: (value?: string) => value === newPwd || 'Passwords do not match'
                    })}
                    className="form-control"
                    placeholder="Confirm your new password"
                  />
                  {pwdErrors.confirm_password && <p className="text-sm text-danger" style={{ color: 'var(--color-error)' }}>{pwdErrors.confirm_password.message}</p>}
                </div>
              </div>
              <div className="card-footer">
                <button
                  type="submit"
                  disabled={isUpdatingPwd}
                  className="btn btn-secondary"
                >
                  {isUpdatingPwd ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
