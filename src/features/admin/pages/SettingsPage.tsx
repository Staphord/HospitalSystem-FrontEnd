import React, { useState } from 'react';
import { useApp } from '@/features/admin/context/AppContext';
import { useAuth } from '@/hooks/useAuth';

interface ContactInfo {
  name: string;
  occupation: string;
  email: string;
  phone: string;
}

interface SettingsState {
  hospitalName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  sessionTimeout: string;
  passwordExpiry: string;
  mfaDoctors: boolean;
  primaryContact: ContactInfo;
  secondaryContact: ContactInfo;
  criticalLabAlerts: boolean;
  lowStockAlerts: boolean;
  overduePatientAlerts: boolean;
  maintenanceNotices: boolean;
  renewalReminders: boolean;
}

// Renders settings control panel, regional restrictions, and contact details
export const SettingsPage: React.FC = () => {
  const { setActiveView } = useApp();
  const { tenantId, user } = useAuth();

  // Retrieve dynamic hospital name based on the active tenant ID
  const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]');
  const currentTenant = tenants.find((t: any) => t.tenant_id === tenantId);
  const hospitalName =
    user?.hospital_name ||
    (currentTenant ? currentTenant.hospital_name : null) ||
    'Muhimbili National Hospital';

  const [settings, setSettings] = useState<SettingsState>({
    hospitalName,
    address: 'Kalenga St, Dar es Salaam',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    phone: '+255 22 215 1361',
    email: 'admin@mnh.or.tz',
    sessionTimeout: '15 Minutes (Default)',
    passwordExpiry: '90 Days (Default)',
    mfaDoctors: true,
    primaryContact: {
      name: 'John Doe',
      occupation: 'Medical Director',
      email: 'john.doe@mnh.or.tz',
      phone: '+255 712 345 678'
    },
    secondaryContact: {
      name: 'Jane Smith',
      occupation: 'Operations Manager',
      email: 'jane.smith@mnh.or.tz',
      phone: '+255 712 987 654'
    },
    criticalLabAlerts: true,
    lowStockAlerts: true,
    overduePatientAlerts: false,
    maintenanceNotices: true,
    renewalReminders: false
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update specific setting values
  const handleChange = (updater: (prev: SettingsState) => SettingsState) => {
    setSettings(prev => updater(prev));
    setIsDirty(true);
  };

  // Submit changes to backend mock simulation
  const handleSaveChanges = () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setIsDirty(false);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-lg space-y-lg">
      <div className="mb-lg">
        <div className="flex justify-between items-start">
          <div>
            <nav className="flex text-label-sm text-outline mt-1">
              <span>Hospital Configuration</span>
              <span className="mx-2">/</span>
              <span className="text-secondary">General Settings</span>
            </nav>
          </div>
          
          <button
            onClick={handleSaveChanges}
            disabled={!isDirty || isSaving}
            className={`font-label-md px-lg py-2 rounded-lg transition-all ${
              saveSuccess
                ? 'bg-success text-white shadow-md'
                : isDirty && !isSaving
                ? 'bg-primary text-white hover:bg-primary-container shadow-md active:scale-95'
                : 'bg-primary/50 text-white cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Saving...
              </span>
            ) : saveSuccess ? (
              'Changes Saved!'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Grid Settings Layout */}
      <div className="grid grid-cols-12 gap-lg">
        {/* Section 1: Hospital Identity */}
        <section className="col-span-12 lg:col-span-8 bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="p-lg border-b border-border-subtle">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">domain</span>
              Hospital Identity
            </h3>
          </div>
          <div className="p-lg space-y-lg">
            <div className="flex flex-col md:flex-row gap-lg">
              <div className="flex-shrink-0">
                <label className="text-label-md text-outline block mb-2 font-semibold">Hospital Logo</label>
                <div className="flex items-center gap-lg">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/20 p-1">
                    <img
                      alt="Muhimbili National Hospital Logo"
                      className="w-full h-full rounded-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOkSEIEBn5FTWAiYZwMS5C0gihlB36KbhJH2Dr-TWLrqVZ9dagCtqPeVwRE2zJeY3KtvRGTZyrIahD42wBAhzbBcNSni9xx0Mz1Bk1xGWIXo_NKENVrXkuXA_rl9tBxxKbTKMZQkQdH94H0gAc8wBIaq4IV-mNjpiXuM80b3XB_HA1T3PtgA7DTppa7Top6SnqzaCTpHkhlth_-vSd_ZajpKC5lIwHwJ0XX3GT4YWa5rdApiJxEaZh0du11E7z6Ryz5AxdUMLW8wm_"
                    />
                  </div>
                  <div className="flex-1 border-2 border-dashed border-border-subtle rounded-xl p-md text-center hover:border-primary transition-colors cursor-pointer group">
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">upload_file</span>
                    <p className="text-label-md text-outline mt-1">Drag and drop or <span className="text-primary">browse</span></p>
                    <p className="text-label-sm text-outline-variant mt-0.5">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-label-md text-outline block mb-2 font-semibold">Hospital Name</label>
                <input
                  type="text"
                  value={settings.hospitalName}
                  onChange={(e) => handleChange(prev => ({ ...prev, hospitalName: e.target.value }))}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="text-label-md text-outline block mb-2 font-semibold">Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">City</label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => handleChange(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Country</label>
                  <input
                    type="text"
                    value={settings.country}
                    onChange={(e) => handleChange(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="text-label-md text-outline block mb-2 font-semibold">Primary Phone</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleChange(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-label-md text-outline block mb-2 font-semibold">Admin Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Subscription Info Side Card */}
        <section className="col-span-12 lg:col-span-4 space-y-lg">
          <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden h-full flex flex-col shadow-sm">
            <div className="p-lg border-b border-border-subtle">
              <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">workspace_premium</span>
                Subscription Info
              </h3>
            </div>
            <div className="p-lg flex-1 flex flex-col justify-between">
              <div className="bg-surface-container-low p-lg rounded-xl space-y-md">
                <div className="flex justify-between items-center">
                  <span className="text-label-md text-outline">Current Plan</span>
                  <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-label-sm font-bold">Standard</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-label-md text-outline">Status</span>
                  <span className="bg-success/10 text-success px-2 py-1 rounded text-label-sm font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success" /> Active
                  </span>
                </div>
                <div className="pt-md border-t border-border-subtle">
                  <p className="text-label-sm text-outline">Next Billing Date</p>
                  <p className="text-body-md font-bold text-on-surface">15 Jun 2026</p>
                </div>
              </div>
              <div className="mt-lg">
                <button
                  type="button"
                  onClick={() => setActiveView('subscription')}
                  className="text-primary font-label-md flex items-center gap-2 hover:underline"
                >
                  View Full Subscription Details
                  <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Regional Settings (Read-only) */}
        <section className="col-span-12 bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="p-lg border-b border-border-subtle">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">public</span>
              Regional Settings
            </h3>
          </div>
          <div className="p-lg">
            <div className="bg-row-hover rounded-lg p-md mb-lg flex items-start gap-3 border border-primary/10">
              <span className="material-symbols-outlined text-primary mt-0.5">lock</span>
              <p className="text-body-sm text-on-secondary-container">
                Timezone, currency, and data region are configured by your system administrator and cannot be changed here.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
              <div>
                <label className="text-label-md text-outline block mb-2">Timezone</label>
                <input
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-md py-2 text-body-md text-outline cursor-not-allowed"
                  readOnly
                  type="text"
                  value="(GMT+03:00) East Africa Time"
                />
              </div>
              <div>
                <label className="text-label-md text-outline block mb-2">Currency</label>
                <input
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-md py-2 text-body-md text-outline cursor-not-allowed"
                  readOnly
                  type="text"
                  value="Tanzanian Shilling (TZS)"
                />
              </div>
              <div>
                <label className="text-label-md text-outline block mb-2">Date Format</label>
                <input
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-md py-2 text-body-md text-outline cursor-not-allowed"
                  readOnly
                  type="text"
                  value="DD/MM/YYYY"
                />
              </div>
              <div>
                <label className="text-label-md text-outline block mb-2">Data Region</label>
                <input
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-md py-2 text-body-md text-outline cursor-not-allowed"
                  readOnly
                  type="text"
                  value="East Africa (Dar es Salaam)"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Security Settings */}
        <section className="col-span-12 md:col-span-6 bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="p-lg border-b border-border-subtle">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">security</span>
              Security Settings
            </h3>
          </div>
          <div className="p-lg space-y-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="text-label-md text-outline block mb-2">Session Timeout</label>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => handleChange(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary outline-none"
                >
                  <option>15 Minutes (Default)</option>
                  <option>30 Minutes</option>
                  <option>1 Hour</option>
                </select>
              </div>
              <div>
                <label className="text-label-md text-outline block mb-2">Password Expiry</label>
                <select
                  value={settings.passwordExpiry}
                  onChange={(e) => handleChange(prev => ({ ...prev, passwordExpiry: e.target.value }))}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary outline-none"
                >
                  <option>30 Days</option>
                  <option>90 Days (Default)</option>
                  <option>180 Days</option>
                </select>
              </div>
            </div>
            <div className="space-y-md pt-md">
              <div className="flex items-center justify-between p-md bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  <div>
                    <p className="text-body-md font-bold flex items-center gap-2">
                      MFA Required for Admins
                      <span className="material-symbols-outlined text-[16px] text-outline">lock</span>
                    </p>
                    <p className="text-label-sm text-outline">Mandatory multi-factor authentication for all portal admins.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-11 h-6 rounded-full relative bg-primary/50 cursor-not-allowed"
                  aria-label="MFA for Admins (Mandatory Lock)"
                >
                  <div className="absolute top-[2px] right-[2px] w-5 h-5 bg-white rounded-full shadow-sm" />
                </button>
              </div>
              <div className="flex items-center justify-between p-md border border-border-subtle rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">medical_services</span>
                  <div>
                    <p className="text-body-md font-bold">MFA Required for Doctors</p>
                    <p className="text-label-sm text-outline">Require MFA for hospital medical staff access.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange(prev => ({ ...prev, mfaDoctors: !prev.mfaDoctors }))}
                  className={`w-11 h-6 rounded-full relative transition-all shadow-inner ${
                    settings.mfaDoctors ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  aria-label="Toggle MFA requirement for doctors"
                >
                  <div
                    className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                      settings.mfaDoctors ? 'right-[2px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Contact Information & Notifications */}
        <section className="col-span-12 md:col-span-6 bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="p-lg border-b border-border-subtle">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Contact Information
            </h3>
          </div>
          <div className="p-lg space-y-lg">
            <div>
              <h4 className="font-label-md text-primary uppercase tracking-wider mb-md">Primary Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={settings.primaryContact.name}
                    onChange={(e) =>
                      handleChange(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, name: e.target.value }
                      }))
                    }
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Occupation</label>
                  <input
                    type="text"
                    value={settings.primaryContact.occupation}
                    onChange={(e) =>
                      handleChange(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, occupation: e.target.value }
                      }))
                    }
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g. Medical Director"
                  />
                </div>
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Email</label>
                  <input
                    type="email"
                    value={settings.primaryContact.email}
                    onChange={(e) =>
                      handleChange(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, email: e.target.value }
                      }))
                    }
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="john.doe@mnh.or.tz"
                  />
                </div>
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.primaryContact.phone}
                    onChange={(e) =>
                      handleChange(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, phone: e.target.value }
                      }))
                    }
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="+255 ..."
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-lg">
              <h4 className="font-label-md text-primary uppercase tracking-wider mb-md">Secondary Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={settings.secondaryContact.name}
                    onChange={(e) =>
                      handleChange(prev => ({
                        ...prev,
                        secondaryContact: { ...prev.secondaryContact, name: e.target.value }
                      }))
                    }
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g. Jane Smith"
                  />
                </div>
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Occupation</label>
                  <input
                    type="text"
                    value={settings.secondaryContact.occupation}
                    onChange={(e) =>
                      handleChange(prev => ({
                        ...prev,
                        secondaryContact: { ...prev.secondaryContact, occupation: e.target.value }
                      }))
                    }
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g. Operations Manager"
                  />
                </div>
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Email</label>
                  <input
                    type="email"
                    value={settings.secondaryContact.email}
                    onChange={(e) =>
                      handleChange(prev => ({
                        ...prev,
                        secondaryContact: { ...prev.secondaryContact, email: e.target.value }
                      }))
                    }
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="jane.smith@mnh.or.tz"
                  />
                </div>
                <div>
                  <label className="text-label-md text-outline block mb-2 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.secondaryContact.phone}
                    onChange={(e) =>
                      handleChange(prev => ({
                        ...prev,
                        secondaryContact: { ...prev.secondaryContact, phone: e.target.value }
                      }))
                    }
                    className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="+255 ..."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Notification Preferences */}
        <section className="col-span-12 md:col-span-6 bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="p-lg border-b border-border-subtle">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              Notification Preferences
            </h3>
          </div>
          <div className="p-lg space-y-md">
            <label className="flex items-start gap-4 p-2 hover:bg-row-hover rounded-lg transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.criticalLabAlerts}
                onChange={(e) => handleChange(prev => ({ ...prev, criticalLabAlerts: e.target.checked }))}
                className="mt-1 w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
              />
              <div>
                <p className="text-body-md font-bold">Critical Lab Value Alerts</p>
                <p className="text-body-sm text-outline">Instant notification when laboratory results exceed critical safety thresholds.</p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-2 hover:bg-row-hover rounded-lg transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.lowStockAlerts}
                onChange={(e) => handleChange(prev => ({ ...prev, lowStockAlerts: e.target.checked }))}
                className="mt-1 w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
              />
              <div>
                <p className="text-body-md font-bold">Low Pharmacy Stock Alerts</p>
                <p className="text-body-sm text-outline">Weekly reports and instant alerts when essential medication stock is below 10%.</p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-2 hover:bg-row-hover rounded-lg transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.overduePatientAlerts}
                onChange={(e) => handleChange(prev => ({ ...prev, overduePatientAlerts: e.target.checked }))}
                className="mt-1 w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
              />
              <div>
                <p className="text-body-md font-bold">Overdue Patient Alerts</p>
                <p className="text-body-sm text-outline">Notify when patient appointments are missed or follow-ups are delayed by &gt;48h.</p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-2 hover:bg-row-hover rounded-lg transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceNotices}
                onChange={(e) => handleChange(prev => ({ ...prev, maintenanceNotices: e.target.checked }))}
                className="mt-1 w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
              />
              <div>
                <p className="text-body-md font-bold">System Maintenance Notices</p>
                <p className="text-body-sm text-outline">Updates regarding planned downtime, security patches, and system upgrades.</p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-2 hover:bg-row-hover rounded-lg transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.renewalReminders}
                onChange={(e) => handleChange(prev => ({ ...prev, renewalReminders: e.target.checked }))}
                className="mt-1 w-5 h-5 rounded border-border-subtle text-primary focus:ring-primary"
              />
              <div>
                <p className="text-body-md font-bold">Subscription Renewal Reminders</p>
                <p className="text-body-sm text-outline">Billing notifications sent 30, 15, and 7 days before the renewal date.</p>
              </div>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};
