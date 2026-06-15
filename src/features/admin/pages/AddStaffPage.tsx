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
  const [role, setRole] = useState<'doctor' | 'nurse' | 'admin' | 'tech'>(
    staffMember ? staffMember.role : 'doctor'
  );
  const [landingDepartment, setLandingDepartment] = useState(
    staffMember ? staffMember.landingDepartment : 'Cardiology'
  );
  const [additionalDepts, setAdditionalDepts] = useState<string[]>(
    staffMember ? staffMember.additionalDepartments : ['Radiology']
  );
  const [mfaEnabled, setMfaEnabled] = useState(
    staffMember ? staffMember.mfaEnabled : true
  );
  const [tempPassword, setTempPassword] = useState('Hk9#mP2L');
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Generates randomized temporary passwords for staff account setups
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  // Triggers navigation back to the directory grid
  const handleCancel = () => {
    clearStaffError();
    setActiveView('staff');
  };

  // Check additional departments selection
  const handleDeptCheckChange = (dept: string) => {
    setAdditionalDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
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
      landingDepartment,
      additionalDepartments: additionalDepts,
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
                  onChange={(e) => setRole(e.target.value as 'doctor' | 'nurse' | 'admin' | 'tech')}
                >
                  <option value="doctor">Doctor (Clinical Staff)</option>
                  <option value="nurse">Nurse</option>
                  <option value="tech">Technician</option>
                  <option value="admin">Administrator</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-secondary mt-1">
                Grants privileges corresponding to clinical role specifications.
              </p>
            </div>

            {/* Department Assignment */}
            <div className="bg-surface-container-low rounded-lg p-4 border border-border-subtle">
              <label className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-3">
                Primary Department (Login Landing) <span className="text-error">*</span>
              </label>
              <p className="text-[10px] text-secondary mb-4">
                Staff will land on this department automatically after login.
              </p>
              <div className="space-y-3">
                {['Cardiology', 'Pediatrics', 'General Surgery'].map((dept) => (
                  <label key={dept} className="flex items-start gap-3 cursor-pointer">
                    <input
                      checked={landingDepartment === dept}
                      className="mt-0.5 w-4 h-4 text-primary bg-surface-white border-border-subtle focus:ring-primary"
                      name="dept_landing"
                      type="radio"
                      onChange={() => setLandingDepartment(dept)}
                    />
                    <span className="block font-body-sm font-medium text-xs text-on-surface">
                      {dept}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional departments checklist */}
            <div>
              <label className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-1.5">
                Read-only access to additional departments (optional)
              </label>
              <div className="border border-border-subtle rounded-md bg-surface-white max-h-40 overflow-y-auto">
                {['Emergency Department', 'Radiology', 'Neurology', 'Oncology'].map((dept) => {
                  const isChecked = additionalDepts.includes(dept);
                  return (
                    <div
                      key={dept}
                      className={`px-3 py-2 border-b border-border-subtle last:border-b-0 hover:bg-surface-bright flex items-center gap-2 ${
                        isChecked ? 'bg-row-hover' : ''
                      }`}
                    >
                      <input
                        checked={isChecked}
                        onChange={() => handleDeptCheckChange(dept)}
                        className="w-4 h-4 text-primary border-border-subtle rounded focus:ring-primary"
                        type="checkbox"
                      />
                      <span className={`text-xs ${isChecked ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                        {dept}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MFA requirements switch */}
            <div className="flex items-center justify-between py-3 border-t border-border-subtle">
              <div>
                <h3 className="font-body-sm font-medium text-sm text-on-surface flex items-center gap-1.5">
                  Require Multi-Factor Authentication
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '16px' }}>
                    lock
                  </span>
                </h3>
                <p className="text-[10px] text-secondary">
                  Mandatory authentication security policy for administrative roles.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={mfaEnabled}
                  onChange={(e) => setMfaEnabled(e.target.checked)}
                  className="sr-only peer"
                  type="checkbox"
                />
                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
              </label>
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
            <div className="space-y-6">
              {/* Password setup triggers */}
              <div>
                <label className="block font-label-md text-[11px] font-bold tracking-wide uppercase text-on-surface-variant mb-1.5">
                  Temporary Password
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className="w-full border border-border-subtle rounded text-xs px-3 py-2 pr-10 bg-surface-white font-mono focus:outline-none focus:border-primary"
                      readOnly
                      type="text"
                      value={tempPassword}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary bg-transparent border-0 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        visibility
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 py-2 text-primary text-xs font-semibold hover:bg-surface-container-low rounded transition-colors bg-transparent border-0 cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Force Password Change switch */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  checked={forcePasswordChange}
                  onChange={(e) => setForcePasswordChange(e.target.checked)}
                  className="w-4 h-4 text-primary border-border-subtle rounded focus:ring-primary"
                  type="checkbox"
                />
                <span className="text-xs text-on-surface">
                  Force password change on first login
                </span>
              </label>

              {/* Send Welcome Email Toggle switch */}
              <div className="flex items-start gap-4 bg-surface-bright p-4 rounded-lg border border-border-subtle">
                <div className="mt-0.5 text-primary">
                  <span className="material-symbols-outlined">mark_email_read</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-body-sm font-medium text-xs text-on-surface mb-1">
                    Send Welcome Email
                  </h3>
                  <p className="text-[10px] text-secondary">
                    An automated email containing instructions will be sent to the address above.
                  </p>
                </div>
                <label className="relative inline-flex inline-flex items-center cursor-pointer shrink-0">
                  <input
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
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
