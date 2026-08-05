import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

// Wizard view handling creation and modification of staff personnel records
export function AddStaffPage() {
  const { activeView, selectedStaffId, staffList, addStaff, updateStaff, staffError, clearStaffError, setActiveView } = useApp();
  const isEditMode = activeView === 'edit-staff';

  // Retrieve existing record when in editing mode
  const staffMember = isEditMode && selectedStaffId
    ? staffList.find((s) => s.id === selectedStaffId)
    : null;

  // State values for form fields
  const [name, setName] = useState(staffMember ? staffMember.name : '');
  const [email, setEmail] = useState(staffMember ? staffMember.email : '');
  const [phone, setPhone] = useState(staffMember ? staffMember.phone.replace('+255 ', '') : '');
  const [role, setRole] = useState<string>(
    staffMember ? staffMember.role : 'doctor'
  );
  const [mfaEnabled, setMfaEnabled] = useState(
    staffMember ? staffMember.mfaEnabled : true
  );

  // Triggers navigation back to the directory grid
  const handleCancel = () => {
    clearStaffError();
    setActiveView('staff');
  };

  // Handles submissions of personnel data records
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearStaffError();

    if (!name || !email) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      name,
      email,
      phone: phone ? `+255 ${phone}` : '',
      role,
      landingDepartment: '',
      mfaEnabled,
      avatarUrl: ''
    };

    if (isEditMode && selectedStaffId) {
      updateStaff(selectedStaffId, payload);
      setActiveView('staff');
    } else {
      const success = addStaff(payload);
      if (success) {
        setActiveView('staff');
      }
    }
  };

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

      {/* Renders validation errors */}
      {staffError && (
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
                className="w-full border border-border-subtle rounded text-xs px-3 py-2 bg-surface-white focus:outline-none focus:border-primary"
                placeholder="e.g. Dr. Jane Doe"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="emailAddress" className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-1.5">
                Email Address <span className="text-error">*</span>
              </label>
              <input
                id="emailAddress"
                className="w-full border border-border-subtle rounded text-xs px-3 py-2 bg-surface-white focus:outline-none focus:border-primary"
                placeholder="name@muhimbili.go.tz"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
                  className="w-full appearance-none border border-border-subtle rounded text-xs px-3 py-2 bg-surface-white focus:outline-none focus:border-primary pr-10"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="doctor">Doctor (Clinical Staff)</option>
                  <option value="triage_nurse">Triage Nurse (OPD Vitals)</option>
                  <option value="ward_nurse">Ward Nurse (Inpatient Care)</option>
                  <option value="receptionist">Receptionist (Patient Registration)</option>
                  <option value="lab_technician">Lab Technician (Laboratory Services)</option>
                  <option value="pharmacist">Pharmacist (Pharmacy &amp; Dispensing)</option>
                  <option value="billing_officer">Billing Officer (Finance &amp; Payments)</option>
                  <option value="hospital_admin">Administrator (System Admin)</option>
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
            <div className="border-b border-border-subtle pb-3 mb-5">
              <h2 className="font-headline-sm text-base font-semibold text-on-surface m-0">
                Account Setup
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-surface-bright p-4 rounded-lg border border-border-subtle">
                <div className="mt-0.5 text-primary">
                  <span className="material-symbols-outlined">lock_reset</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-body-sm font-medium text-xs text-on-surface mb-1">
                    System Temporary Password
                  </h3>
                  <p className="text-[10px] text-secondary leading-relaxed">
                    New staff accounts are automatically assigned the system default temporary password (<code className="font-mono text-primary font-semibold">TemporaryPassword123!</code>). Users will be prompted to change their password upon first login.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Form Actions Footer Bar */}
        <div className="fixed bottom-0 right-0 left-0 lg:left-[240px] bg-surface-white border-t border-border-subtle p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-[720px] mx-auto flex justify-between items-center px-md">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-secondary text-xs font-semibold hover:text-on-surface transition-colors border border-transparent hover:border-border-subtle rounded bg-transparent cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-border-subtle rounded text-secondary hover:bg-surface-bright text-xs font-semibold transition-colors bg-transparent cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-on-primary rounded text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm border-0 cursor-pointer"
              >
                {isEditMode ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
