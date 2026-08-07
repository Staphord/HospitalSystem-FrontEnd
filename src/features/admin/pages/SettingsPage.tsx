import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useApp } from '@/features/admin/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { adminService } from '@/api/services/admin';
import { masterService } from '@/api/services/master';
import type { Subscription } from '@/api/types/master';

const DEFAULT_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBOkSEIEBn5FTWAiYZwMS5C0gihlB36KbhJH2Dr-TWLrqVZ9dagCtqPeVwRE2zJeY3KtvRGTZyrIahD42wBAhzbBcNSni9xx0Mz1Bk1xGWIXo_NKENVrXkuXA_rl9tBxxKbTKMZQkQdH94H0gAc8wBIaq4IV-mNjpiXuM80b3XB_HA1T3PtgA7DTppa7Top6SnqzaCTpHkhlth_-vSd_ZajpKC5lIwHwJ0XX3GT4YWa5rdApiJxEaZh0du11E7z6Ryz5AxdUMLW8wm_';

interface ContactInfo {
  name: string;
  occupation: string;
  email: string;
  phone: string;
}

interface SettingsState {
  hospitalName: string;
  logoUrl: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  sessionTimeout: string;
  passwordExpiry: string;
  mfaDoctors: boolean;
  mfaAdmins: boolean;
  timezone: string;
  currency: string;
  dateFormat: string;
  primaryContact: ContactInfo;
  secondaryContact: ContactInfo;
  criticalLabAlerts: boolean;
  lowStockAlerts: boolean;
  overduePatientAlerts: boolean;
  maintenanceNotices: boolean;
  renewalReminders: boolean;
}

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}> = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    onClick={onChange}
    aria-label={ariaLabel}
    style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      width: '36px',
      height: '20px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      background: checked ? '#0052cc' : '#c1c7d0',
      transition: 'background 0.2s',
      padding: 0,
      flexShrink: 0,
    }}
  >
    <span
      style={{
        position: 'absolute',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        background: '#ffffff',
        top: '3px',
        left: checked ? '19px' : '3px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    />
  </button>
);

// Renders settings control panel, regional restrictions, and contact details
export const SettingsPage: React.FC = () => {
  const { setActiveView } = useApp();
  const { user, setUser } = useAuth();

  const hospitalName = user?.hospital_name || 'Hospital'

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SettingsState>({
    hospitalName,
    logoUrl: '',
    address: 'Kalenga St, Dar es Salaam',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    phone: '+255 22 215 1361',
    email: 'admin@mnh.or.tz',
    sessionTimeout: '15 Minutes (Default)',
    passwordExpiry: '90 Days (Default)',
    mfaDoctors: true,
    mfaAdmins: false,
    timezone: 'Not configured',
    currency: 'Not configured',
    dateFormat: 'Not configured',
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Load current subscription summary for the side card
  useEffect(() => {
    masterService
      .getMySubscription()
      .then((subs) => setSubscription(subs[0] ?? null))
      .catch(() => setSubscription(null))
      .finally(() => setSubscriptionLoading(false));
  }, []);

  // Load persisted hospital settings from admin-service on mount
  useEffect(() => {
    adminService.getSettings()
      .then((stored) => {
        setSettings((prev) => ({
          ...prev,
          hospitalName: stored.hospital_name ?? prev.hospitalName,
          logoUrl: stored.logo_url ?? prev.logoUrl,
          address: stored.address ?? prev.address,
          city: stored.city ?? prev.city,
          country: stored.country ?? prev.country,
          phone: stored.phone ?? prev.phone,
          email: stored.email ?? prev.email,
          sessionTimeout: stored.session_timeout ?? prev.sessionTimeout,
          passwordExpiry: stored.password_expiry ?? prev.passwordExpiry,
          mfaDoctors: stored.mfa_doctors != null ? stored.mfa_doctors === 'true' : prev.mfaDoctors,
          mfaAdmins: stored.mfa_admins != null ? stored.mfa_admins === 'true' : prev.mfaAdmins,
          timezone: stored.timezone ?? prev.timezone,
          currency: stored.currency ?? prev.currency,
          dateFormat: stored.date_format ?? prev.dateFormat,
          primaryContact: {
            name: stored.primary_contact_name ?? prev.primaryContact.name,
            occupation: stored.primary_contact_occupation ?? prev.primaryContact.occupation,
            email: stored.primary_contact_email ?? prev.primaryContact.email,
            phone: stored.primary_contact_phone ?? prev.primaryContact.phone,
          },
          secondaryContact: {
            name: stored.secondary_contact_name ?? prev.secondaryContact.name,
            occupation: stored.secondary_contact_occupation ?? prev.secondaryContact.occupation,
            email: stored.secondary_contact_email ?? prev.secondaryContact.email,
            phone: stored.secondary_contact_phone ?? prev.secondaryContact.phone,
          },
          criticalLabAlerts: stored.critical_lab_alerts != null ? stored.critical_lab_alerts === 'true' : prev.criticalLabAlerts,
          lowStockAlerts: stored.low_stock_alerts != null ? stored.low_stock_alerts === 'true' : prev.lowStockAlerts,
          overduePatientAlerts: stored.overdue_patient_alerts != null ? stored.overdue_patient_alerts === 'true' : prev.overduePatientAlerts,
          maintenanceNotices: stored.maintenance_notices != null ? stored.maintenance_notices === 'true' : prev.maintenanceNotices,
          renewalReminders: stored.renewal_reminders != null ? stored.renewal_reminders === 'true' : prev.renewalReminders,
        }));
      })
      .catch((err) => {
        console.error('Failed to load hospital settings:', err);
      });
  }, []);

  // Update specific setting values
  const handleChange = (updater: (prev: SettingsState) => SettingsState) => {
    setSettings(prev => updater(prev));
    setIsDirty(true);
  };

  // Handles image file selection and converts to Data URL
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        handleChange((prev) => ({ ...prev, logoUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Persist settings to admin-service (key-value store + master profile, FR-55)
  const handleSaveChanges = () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);

    adminService.updateSettings({
      hospital_name: settings.hospitalName,
      logo_url: settings.logoUrl,
      address: settings.address,
      city: settings.city,
      country: settings.country,
      phone: settings.phone,
      email: settings.email,
      session_timeout: settings.sessionTimeout,
      password_expiry: settings.passwordExpiry,
      mfa_doctors: String(settings.mfaDoctors),
      mfa_admins: String(settings.mfaAdmins),
      primary_contact_name: settings.primaryContact.name,
      primary_contact_occupation: settings.primaryContact.occupation,
      primary_contact_email: settings.primaryContact.email,
      primary_contact_phone: settings.primaryContact.phone,
      secondary_contact_name: settings.secondaryContact.name,
      secondary_contact_occupation: settings.secondaryContact.occupation,
      secondary_contact_email: settings.secondaryContact.email,
      secondary_contact_phone: settings.secondaryContact.phone,
      critical_lab_alerts: String(settings.criticalLabAlerts),
      low_stock_alerts: String(settings.lowStockAlerts),
      overdue_patient_alerts: String(settings.overduePatientAlerts),
      maintenance_notices: String(settings.maintenanceNotices),
      renewal_reminders: String(settings.renewalReminders),
    })
      .then(() => {
        setSaveSuccess(true);
        setIsDirty(false);
        const profileData = {
          hospital_name: settings.hospitalName,
          logo_url: settings.logoUrl,
        };
        localStorage.setItem('hospital_profile', JSON.stringify(profileData));
        if (user) {
          setUser({
            ...user,
            hospital_name: settings.hospitalName,
            logo_url: settings.logoUrl,
          });
        }
        setTimeout(() => {
          setSaveSuccess(false);
        }, 2000);
      })
      .catch((err) => {
        const detail = err.response?.data?.detail;
        const errorMsg =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
            ? detail.map((d: any) => d.msg || d.detail || JSON.stringify(d)).join(', ')
            : typeof detail === 'object' && detail !== null
            ? JSON.stringify(detail)
            : 'Failed to save settings.';
        toast.error(errorMsg);
      })
      .finally(() => {
        setIsSaving(false);
      });
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
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                  <div className="w-20 h-20 rounded-full border-2 border-primary/20 p-1 flex-shrink-0">
                    <img
                      alt="Hospital Logo"
                      className="w-full h-full rounded-full object-cover"
                      src={settings.logoUrl || DEFAULT_LOGO_URL}
                    />
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-border-subtle rounded-xl p-md text-center hover:border-primary transition-colors cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">upload_file</span>
                    <p className="text-label-md text-outline mt-1">Click to select or <span className="text-primary">browse</span></p>
                    <p className="text-label-sm text-outline-variant mt-0.5">PNG, JPG, WEBP up to 2MB</p>
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
                {subscriptionLoading ? (
                  <p className="text-label-md text-outline">Loading subscription...</p>
                ) : subscription ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-label-md text-outline">Current Plan</span>
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-label-sm font-bold capitalize">
                        {subscription.plan_name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-label-md text-outline">Status</span>
                      <span className={`px-2 py-1 rounded text-label-sm font-bold flex items-center gap-1 capitalize ${
                        subscription.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${subscription.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                        {subscription.status}
                      </span>
                    </div>
                    <div className="pt-md border-t border-border-subtle">
                      <p className="text-label-sm text-outline">Next Billing Date</p>
                      <p className="text-body-md font-bold text-on-surface">
                        {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-label-md text-outline">No active subscription found.</p>
                )}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <div>
                <label className="text-label-md text-outline block mb-2">Timezone</label>
                <input
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-md py-2 text-body-md text-outline cursor-not-allowed"
                  readOnly
                  type="text"
                  value={settings.timezone}
                />
              </div>
              <div>
                <label className="text-label-md text-outline block mb-2">Currency</label>
                <input
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-md py-2 text-body-md text-outline cursor-not-allowed"
                  readOnly
                  type="text"
                  value={settings.currency}
                />
              </div>
              <div>
                <label className="text-label-md text-outline block mb-2">Date Format</label>
                <input
                  className="w-full bg-surface-container-low border border-border-subtle rounded-lg px-md py-2 text-body-md text-outline cursor-not-allowed"
                  readOnly
                  type="text"
                  value={settings.dateFormat}
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
                    <p className="text-body-md font-bold">MFA Required for Admins</p>
                    <p className="text-label-sm text-outline">Mandatory multi-factor authentication for all portal admins.</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.mfaAdmins}
                  onChange={() => handleChange(prev => ({ ...prev, mfaAdmins: !prev.mfaAdmins }))}
                  ariaLabel="Toggle MFA requirement for admins"
                />
              </div>
              <div className="flex items-center justify-between p-md border border-border-subtle rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">medical_services</span>
                  <div>
                    <p className="text-body-md font-bold">MFA Required for Doctors</p>
                    <p className="text-label-sm text-outline">Require MFA for hospital medical staff access.</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.mfaDoctors}
                  onChange={() => handleChange(prev => ({ ...prev, mfaDoctors: !prev.mfaDoctors }))}
                  ariaLabel="Toggle MFA requirement for doctors"
                />
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
            <div className="flex items-center justify-between p-md hover:bg-row-hover rounded-lg transition-colors">
              <div>
                <p className="text-body-md font-bold">Critical Lab Value Alerts</p>
                <p className="text-body-sm text-outline">Instant notification when laboratory results exceed critical safety thresholds.</p>
              </div>
              <ToggleSwitch
                checked={settings.criticalLabAlerts}
                onChange={() => handleChange(prev => ({ ...prev, criticalLabAlerts: !prev.criticalLabAlerts }))}
                ariaLabel="Toggle Critical Lab Value Alerts"
              />
            </div>
            <div className="flex items-center justify-between p-md hover:bg-row-hover rounded-lg transition-colors">
              <div>
                <p className="text-body-md font-bold">Low Pharmacy Stock Alerts</p>
                <p className="text-body-sm text-outline">Weekly reports and instant alerts when essential medication stock is below 10%.</p>
              </div>
              <ToggleSwitch
                checked={settings.lowStockAlerts}
                onChange={() => handleChange(prev => ({ ...prev, lowStockAlerts: !prev.lowStockAlerts }))}
                ariaLabel="Toggle Low Pharmacy Stock Alerts"
              />
            </div>
            <div className="flex items-center justify-between p-md hover:bg-row-hover rounded-lg transition-colors">
              <div>
                <p className="text-body-md font-bold">Overdue Patient Alerts</p>
                <p className="text-body-sm text-outline">Notify when patient appointments are missed or follow-ups are delayed by &gt;48h.</p>
              </div>
              <ToggleSwitch
                checked={settings.overduePatientAlerts}
                onChange={() => handleChange(prev => ({ ...prev, overduePatientAlerts: !prev.overduePatientAlerts }))}
                ariaLabel="Toggle Overdue Patient Alerts"
              />
            </div>
            <div className="flex items-center justify-between p-md hover:bg-row-hover rounded-lg transition-colors">
              <div>
                <p className="text-body-md font-bold">System Maintenance Notices</p>
                <p className="text-body-sm text-outline">Updates regarding planned downtime, security patches, and system upgrades.</p>
              </div>
              <ToggleSwitch
                checked={settings.maintenanceNotices}
                onChange={() => handleChange(prev => ({ ...prev, maintenanceNotices: !prev.maintenanceNotices }))}
                ariaLabel="Toggle System Maintenance Notices"
              />
            </div>
            <div className="flex items-center justify-between p-md hover:bg-row-hover rounded-lg transition-colors">
              <div>
                <p className="text-body-md font-bold">Subscription Renewal Reminders</p>
                <p className="text-body-sm text-outline">Billing notifications sent 30, 15, and 7 days before the renewal date.</p>
              </div>
              <ToggleSwitch
                checked={settings.renewalReminders}
                onChange={() => handleChange(prev => ({ ...prev, renewalReminders: !prev.renewalReminders }))}
                ariaLabel="Toggle Subscription Renewal Reminders"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
