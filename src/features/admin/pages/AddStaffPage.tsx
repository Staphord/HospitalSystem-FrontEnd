import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { adminService } from '@/api/services/admin';
import type { Department } from '@/api/types/admin';

// Wizard view handling creation and modification of staff personnel records
export function AddStaffPage() {
  const { activeView, selectedStaffId, staffList, addStaff, updateStaff, staffError, clearStaffError, setActiveView } = useApp();
  const isEditMode = activeView === 'edit-staff';

  // Retrieve existing record when in editing mode
  const staffMember = isEditMode && selectedStaffId
    ? staffList.find((s) => s.id === selectedStaffId)
    : null;

  // Triggers password generation adhering to security rules (8+ chars, upper, lower, digit, symbol)
  const generateRandomPassword = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*';
    const all = uppers + lowers + numbers + symbols;

    let pwd = '';
    pwd += uppers.charAt(Math.floor(Math.random() * uppers.length));
    pwd += lowers.charAt(Math.floor(Math.random() * lowers.length));
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));
    for (let i = 0; i < 8; i++) {
      pwd += all.charAt(Math.floor(Math.random() * all.length));
    }
    return pwd.split('').sort(() => 0.5 - Math.random()).join('');
  };

  // State values for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('doctor');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [tempPassword, setTempPassword] = useState(() => generateRandomPassword());
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      if (staffMember) {
        setName(staffMember.name || '');
        setEmail(staffMember.email || '');
        setPhone(staffMember.phone ? staffMember.phone.replace(/^\+255\s*/, '') : '');
        setRole(staffMember.role || 'doctor');
        setMfaEnabled(staffMember.mfaEnabled ?? true);
      } else if (selectedStaffId) {
        adminService.getUser(selectedStaffId)
          .then((u) => {
            if (u) {
              setName(u.full_name || u.username || '');
              setEmail(u.email || '');
              setPhone(u.phone ? u.phone.replace(/^\+255\s*/, '') : '');
              setRole(u.role || 'doctor');
              setMfaEnabled(u.mfaEnabled ?? true);
            }
          })
          .catch(() => {});
      }
    }
  }, [isEditMode, selectedStaffId, staffMember]);

  const handleGeneratePassword = () => {
    setTempPassword(generateRandomPassword());
    setCopied(false);
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const SYSTEM_ROLES_LIST = [
    { value: 'hospital_admin', label: 'Administrator (System Admin)' },
    { value: 'doctor', label: 'Doctor (Clinical Staff)' },
    { value: 'triage_nurse', label: 'Triage Nurse (OPD Vitals)' },
    { value: 'ward_nurse', label: 'Ward Nurse (Inpatient Care)' },
    { value: 'nurse', label: 'General Nurse' },
    { value: 'clinician', label: 'Clinician' },
    { value: 'receptionist', label: 'Receptionist (Patient Registration)' },
    { value: 'lab_technician', label: 'Lab Technician (Laboratory Services)' },
    { value: 'radiographer', label: 'Radiographer (Imaging)' },
    { value: 'pharmacist', label: 'Pharmacist (Pharmacy & Dispensing)' },
    { value: 'billing_officer', label: 'Billing Officer (Finance & Payments)' },
    { value: 'cashier', label: 'Cashier (Payments)' },
  ];

  const [rolesList, setRolesList] = useState<Array<{ value: string; label: string }>>(SYSTEM_ROLES_LIST);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    adminService.listDepartments().catch(() => {});

    setLoadingRoles(true);
    Promise.all([
      adminService.listRealmRoles().catch(() => []),
      adminService.listTenantRoles().catch(() => []),
    ])
      .then(([realm, tenant]) => {
        const storedRealm = (() => {
          try {
            const raw = localStorage.getItem('custom_realm_roles');
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();
        const storedTenant = (() => {
          try {
            const raw = localStorage.getItem('custom_tenant_roles');
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        const roleMap = new Map<string, { value: string; label: string }>();
        SYSTEM_ROLES_LIST.forEach((sys) => {
          roleMap.set(sys.value.toLowerCase(), sys);
        });

        const allSources = [...(realm || []), ...(tenant || []), ...storedRealm, ...storedTenant];
        allSources.forEach((r: any) => {
          const rawName = r.name || r.id;
          if (!rawName) return;
          const val = rawName.toLowerCase();
          // Filter internal keycloak technical roles
          if (val.startsWith('default-roles') || val === 'offline_access' || val === 'uma_authorization') return;

          const formattedName = rawName.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          const desc = r.description ? ` (${r.description})` : '';
          roleMap.set(val, {
            value: rawName,
            label: `${formattedName}${desc}`,
          });
        });

        const combined = Array.from(roleMap.values());
        if (combined.length > 0) {
          setRolesList(combined);
          if (!isEditMode && !role) {
            setRole(combined[0].value);
          }
        }
      })
      .finally(() => {
        setLoadingRoles(false);
      });
  }, []);

  // Triggers navigation back to the directory grid
  const handleCancel = () => {
    clearStaffError();
    setActiveView('staff');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handles submissions of personnel data records
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStaffError();
    setIsSubmitting(true);

    if (!name || !email) {
      alert('Please fill out all required fields.');
      setIsSubmitting(false);
      return;
    }

    if (!isEditMode && (!tempPassword || tempPassword.length < 8)) {
      alert('Password must be at least 8 characters long.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name,
      email,
      phone: phone ? `+255 ${phone}` : '',
      role,
      landingDepartment: '',
      mfaEnabled,
      avatarUrl: '',
      password: tempPassword
    };

    try {
      if (isEditMode && selectedStaffId) {
        const success = await updateStaff(selectedStaffId, payload);
        if (success) {
          setActiveView('staff');
        }
      } else {
        const success = await addStaff({ ...payload, password: tempPassword });
        if (success) {
          setActiveView('staff');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const lowerError = (staffError || '').toLowerCase();
  const isEmailOnlyError = lowerError.includes('email') && !lowerError.includes('username') && !lowerError.includes('full_name');
  const isNameOnlyError = (lowerError.includes('username') || lowerError.includes('full_name') || (lowerError.includes('name') && !lowerError.includes('email'))) && !lowerError.includes('email');

  const cleanEmailError = isEmailOnlyError
    ? staffError!.replace(/^Email:\s*/i, '')
    : (lowerError.includes('email')
        ? (lowerError.includes('already') || lowerError.includes('exist') || lowerError.includes('registered') ? 'Email already exists.' : 'Invalid email address.')
        : null);

  const cleanNameError = isNameOnlyError
    ? staffError!.replace(/^(Username|Name|Full Name):\s*/i, '')
    : ((lowerError.includes('username') || lowerError.includes('name')) && !lowerError.includes('email') ? 'Full Name must be at least 3 characters.' : null);

  const isGeneralError = !!staffError && !isEmailOnlyError && !isNameOnlyError;

  return (
    <div className="max-w-[720px] mx-auto pt-sm px-md w-full pb-32">
      {/* Breadcrumb pathing */}
      <nav className="mb-lg flex items-center gap-2 font-headline-sm text-xs" aria-label="Breadcrumb">
        <a
          href="/admin/users"
          onClick={(e) => {
            e.preventDefault();
            handleCancel();
          }}
          className="text-primary hover:underline font-semibold"
        >
          All Staff
        </a>
        <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>
          chevron_right
        </span>
        <span className="text-secondary font-medium">
          {isEditMode ? 'Edit Staff' : 'Add New Staff'}
        </span>
      </nav>

      {/* Renders general non-field errors */}
      {isGeneralError && (
        <div className="mb-md p-md bg-error-container border border-error/20 rounded-lg flex items-center gap-sm">
          <span className="material-symbols-outlined text-error">error</span>
          <span className="font-body-sm text-on-error-container text-xs font-semibold">
            {staffError}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Personal Information Section */}
        <section className="bg-surface-white border border-border-subtle rounded-2xl p-lg shadow-sm">
          <div className="border-b border-border-subtle pb-3 mb-5">
            <h2 className="font-headline-sm text-base font-semibold text-on-surface m-0">
              Personal Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="fullName" className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-1.5">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                id="fullName"
                className={`w-full border rounded text-xs px-3 py-2 bg-surface-white focus:outline-none transition-colors ${
                  cleanNameError ? 'border-error ring-1 ring-error' : 'border-border-subtle focus:border-primary'
                }`}
                placeholder="e.g. Dr. Jane Doe"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {cleanNameError && (
                <p className="text-[11px] text-error font-medium mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{cleanNameError}</span>
                </p>
              )}
            </div>
            <div>
              <label htmlFor="emailAddress" className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-1.5">
                Email Address <span className="text-error">*</span>
              </label>
              <input
                id="emailAddress"
                className={`w-full border rounded text-xs px-3 py-2 bg-surface-white focus:outline-none transition-colors ${
                  cleanEmailError ? 'border-error ring-1 ring-error' : 'border-border-subtle focus:border-primary'
                }`}
                placeholder="name@muhimbili.go.tz"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {cleanEmailError && (
                <p className="text-[11px] text-error font-medium mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{cleanEmailError}</span>
                </p>
              )}
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-1.5">
                Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-border-subtle bg-surface-container-low text-secondary text-xs rounded-l">
                  +255
                </span>
                <input
                  id="phoneNumber"
                  className="flex-1 w-full border border-border-subtle rounded-r text-xs px-3 py-2 bg-surface-white focus:outline-none focus:border-primary"
                  placeholder="712 345 678"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Role & Access Configuration Section */}
        <section className="bg-surface-white border border-border-subtle rounded-2xl p-lg shadow-sm">
          <div className="border-b border-border-subtle pb-3 mb-5">
            <h2 className="font-headline-sm text-base font-semibold text-on-surface m-0">
              Role &amp; Access Configuration
            </h2>
          </div>
          <div className="space-y-6">
            <div>
              <label htmlFor="primaryRole" className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-1.5">
                Primary Role <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  id="primaryRole"
                  className="w-full appearance-none border border-border-subtle rounded text-xs px-3 py-2 bg-surface-white focus:outline-none focus:border-primary pr-10 disabled:opacity-60"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loadingRoles}
                >
                  {rolesList.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-secondary mt-1">
                Role automatically grants portal privileges and assigns landing department.
              </p>
            </div>

            {/* MFA requirements switch card */}
            <div className={`p-4 rounded-xl border transition-all duration-200 ${
              mfaEnabled
                ? 'bg-primary-container/10 border-primary/30 shadow-sm'
                : 'bg-surface-bright border-border-subtle'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    mfaEnabled
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-secondary'
                  }`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {mfaEnabled ? 'shield_lock' : 'lock_open'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-sm font-semibold text-on-surface m-0">
                        Multi-Factor Authentication (MFA)
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        mfaEnabled
                          ? 'bg-[#E3FCEF] text-[#006644] border border-[#006644]/20'
                          : 'bg-surface-container text-secondary border border-border-subtle'
                      }`}>
                        {mfaEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-0.5">
                      {mfaEnabled
                        ? 'Mandatory 2FA security verification required on login for this account.'
                        : 'MFA is currently disabled for this staff account.'}
                    </p>
                  </div>
                </div>

                {/* Native Checkbox Toggle Switch (Fixed Animation) */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={mfaEnabled}
                    onChange={(e) => setMfaEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/40 transition-colors duration-300 peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(0,102,204,0.3)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 peer-checked:after:left-[22px] peer-checked:after:border-white"></div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Account Setup Card */}
        {!isEditMode && (
          <section className="bg-surface-white border border-border-subtle rounded-2xl p-lg shadow-sm">
            <div className="border-b border-border-subtle pb-3 mb-5 flex items-center justify-between">
              <h2 className="font-headline-sm text-base font-semibold text-on-surface m-0">
                Account Setup &amp; Password
              </h2>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">autorenew</span>
                <span>Generate Random</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="tempPassword" className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-1.5">
                  Temporary Password <span className="text-error">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="tempPassword"
                      className="w-full border border-border-subtle rounded text-xs px-3 py-2 pr-10 bg-surface-white font-mono focus:outline-none focus:border-primary"
                      type={showPassword ? 'text' : 'password'}
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Enter or generate temporary password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-secondary hover:text-on-surface bg-transparent border-0 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-secondary hover:text-primary border border-border-subtle rounded bg-surface-white hover:bg-surface-container-low transition-colors cursor-pointer"
                    title="Copy password to clipboard"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-surface-bright p-3.5 rounded-lg border border-border-subtle">
                <div className="mt-0.5 text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-secondary leading-relaxed m-0">
                    Set a custom temporary password or click <strong className="text-on-surface">Generate Random</strong> for an automatic secure password. The user will be prompted to update their password on first login.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Form Actions Footer Bar */}
        <footer className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-auto lg:right-0 w-full lg:w-[calc(100%-240px)] bg-surface-white border-t border-border-subtle px-lg py-md z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="max-w-[720px] mx-auto flex flex-col items-center">
            <div className="flex items-center justify-between w-full gap-md">
              <button
                type="button"
                onClick={handleCancel}
                style={{ padding: '0 32px', height: '48px', minWidth: '120px' }}
                className="rounded-lg border border-border-subtle text-secondary font-headline-sm hover:bg-surface-container-low transition-colors bg-white cursor-pointer flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: '#0052CC', color: 'white', padding: '0 32px', height: '48px', minWidth: '160px' }}
                className="rounded-lg font-headline-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add User')}</span>
                {!isSubmitting && (
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                )}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}
