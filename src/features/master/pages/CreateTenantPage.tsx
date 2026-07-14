import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { masterService } from '@/api/services/master'
import type { SubscriptionPlan } from '@/api/types/master'
import { toast } from 'sonner'

export function CreateTenantPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hospital Info states
  const [hospitalName, setHospitalName] = useState('')
  const [registrationId, setRegistrationId] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [address, setAddress] = useState('')

  // Primary Contact states
  const [primaryName, setPrimaryName] = useState('')
  const [primaryOccupation, setPrimaryOccupation] = useState('')
  const [primaryEmail, setPrimaryEmail] = useState('')
  const [primaryPhone, setPrimaryPhone] = useState('')

  // Billing Contact states
  const [billingEmail, setBillingEmail] = useState('')

  // System Config states
  const [timezone, setTimezone] = useState('Africa/Dar_es_Salaam')
  const [currency, setCurrency] = useState('TZS')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  const [dataRegion, setDataRegion] = useState('Africa-East')

  // Subscription Setup states
  const [freeTrial, setFreeTrial] = useState(true)
  const [isAnnual, setIsAnnual] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('standard')

  // Branding states
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState('')

  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load plans on mount
  useEffect(() => {
    masterService.listPlans()
      .then((data) => {
        setPlans(data)
        const defaultPlan = data.find((plan) => plan.plan_id === 'standard') || data[0]
        if (defaultPlan) {
          setSelectedPlanId(defaultPlan.plan_id)
        }
      })
      .catch(() => {})
  }, [])

  // Update fields based on country selection
  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry)
    if (selectedCountry === 'Tanzania') {
      setCity('Dar es Salaam')
      setTimezone('Africa/Dar_es_Salaam')
      setCurrency('TZS')
      setDataRegion('Africa-East')
    } else if (selectedCountry === 'Kenya') {
      setCity('Nairobi')
      setTimezone('Africa/Nairobi')
      setCurrency('KES')
      setDataRegion('Africa-East')
    } else if (selectedCountry === 'Uganda') {
      setCity('Kampala')
      setTimezone('Africa/Kampala')
      setCurrency('UGX')
      setDataRegion('Africa-East')
    }
  }

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoUrl(URL.createObjectURL(file))
    }
  }

  // Clear logo selection
  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLogoFile(null)
    setLogoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Validate form fields
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!hospitalName.trim()) newErrors.hospitalName = 'Hospital Name is required.'
    if (!country.trim()) newErrors.country = 'Country is required.'
    if (!city.trim()) newErrors.city = 'City is required.'
    
    if (!primaryName.trim()) newErrors.primaryName = 'Primary Contact Full Name is required.'
    if (!primaryEmail.trim()) newErrors.primaryEmail = 'Primary Contact Email is required.'
    else if (!/\S+@\S+\.\S+/.test(primaryEmail)) newErrors.primaryEmail = 'Primary Contact Email is invalid.'
    
    if (!primaryPhone.trim()) newErrors.primaryPhone = 'Primary Contact Phone Number is required.'
    
    if (!billingEmail.trim()) newErrors.billingEmail = 'Billing Email is required.'
    else if (!/\S+@\S+\.\S+/.test(billingEmail)) newErrors.billingEmail = 'Billing Email is invalid.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Fill all required fields.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)

    try {
      let finalLogoUrl: string | undefined = undefined
      if (logoFile) {
        finalLogoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(logoFile)
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = (error) => reject(error)
        })
      }

      const payload = {
        hospital_name: hospitalName,
        admin_username: `admin_${hospitalName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'hosp'}`,
        admin_email: primaryEmail,
        admin_full_name: primaryName,
        country,
        city,
        address,
        timezone,
        currency,
        date_format: dateFormat,
        logo_url: finalLogoUrl,
        logo: finalLogoUrl,
        data_region: dataRegion,
        primary_contact_name: primaryName,
        primary_contact_email: primaryEmail,
        primary_contact_phone: primaryPhone,
        billing_email: billingEmail,
        tax_id: registrationId || undefined,
        plan_id: selectedPlanId,
        billing_cycle: isAnnual ? 'annual' : 'monthly',
      }

      await masterService.createTenant(payload)
      toast.success(`Hospital "${hospitalName}" onboarded successfully!`)
      navigate('/master/tenants')
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to onboard hospital.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-2">
      {/* Page Header */}
      <div className="px-xl py-md max-w-[720px] mx-auto">
        <div className="flex items-center gap-sm text-secondary mb-2">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <Link to="/master/tenants" className="font-label-md text-label-md text-secondary hover:text-primary no-underline">
            Back to Hospital List
          </Link>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Add New Hospital</h1>
        <p className="font-body-md text-body-md text-secondary mb-0">
          Register a new healthcare facility and configure their system preferences.
        </p>
      </div>

      {/* Error Display Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="max-w-[720px] mx-auto px-xl mb-md">
          <div className="p-md border border-error bg-error-container rounded-lg text-on-error-container font-body-sm">
            <strong className="block mb-xs">Please correct the following errors:</strong>
            <ul className="list-disc pl-md space-y-xs">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="px-xl pb-[120px] max-w-[720px] mx-auto">
        <form onSubmit={handleSubmit} className="space-y-xl">
          
          {/* Section 1: Hospital Information */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="flex items-center gap-2 mb-lg">
              <span className="material-symbols-outlined text-primary">apartment</span>
              <h2 className="font-headline-sm text-headline-sm m-0">Hospital Information</h2>
            </div>
            <div className="space-y-md">
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Hospital Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                    placeholder="e.g. Dar City Medical Center"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Registration ID
                  </label>
                  <input
                    type="text"
                    className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                    placeholder="e.g. REG-123456"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="country_select" className="block font-label-md text-label-md text-on-surface mb-xs">
                  Country <span className="text-error">*</span>
                </label>
                <select
                  id="country_select"
                  className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                >
                  <option value="" disabled>Select country</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Uganda">Uganda</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label htmlFor="city_input" className="block font-label-md text-label-md text-on-surface mb-xs">
                    City <span className="text-error">*</span>
                  </label>
                  <input
                    id="city_input"
                    type="text"
                    className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                    placeholder="e.g. Dar es Salaam"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                    placeholder="e.g. 11101"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                  Full Address
                </label>
                <textarea
                  className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                  placeholder="Enter physical location details..."
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Primary Contact */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="flex items-center gap-2 mb-lg">
              <span className="material-symbols-outlined text-primary">person</span>
              <h2 className="font-headline-sm text-headline-sm m-0">Primary Contact</h2>
            </div>
            <div className="space-y-md">
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                    placeholder="Enter primary administrator name"
                    value={primaryName}
                    onChange={(e) => setPrimaryName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Occupation
                  </label>
                  <input
                    type="text"
                    className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                    placeholder="e.g. Medical Director"
                    value={primaryOccupation}
                    onChange={(e) => setPrimaryOccupation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                    placeholder="name@hospital.com"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">
                    Phone <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                    placeholder="+255 --- --- ---"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Billing Contact */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="flex items-center gap-2 mb-lg">
              <span className="material-symbols-outlined text-primary">payments</span>
              <h2 className="font-headline-sm text-headline-sm m-0">Billing Contact</h2>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-xs">
                Billing Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                placeholder="accounts@hospital.com"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
              />
              <p className="font-label-sm text-label-sm text-secondary mt-xs mb-0">
                Subscription invoices will be sent here
              </p>
            </div>
          </section>

          {/* Section 4: System Configuration */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="flex items-center gap-2 mb-lg">
              <span className="material-symbols-outlined text-primary">settings_suggest</span>
              <h2 className="font-headline-sm text-headline-sm m-0">System Configuration</h2>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label htmlFor="timezone_select" className="block font-label-md text-label-md text-on-surface mb-xs">
                  Timezone
                </label>
                <select
                  id="timezone_select"
                  className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</option>
                  <option value="Africa/Nairobi">Africa/Nairobi</option>
                  <option value="Africa/Kampala">Africa/Kampala</option>
                  <option value="Africa/Kigali">Africa/Kigali</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label htmlFor="currency_select" className="block font-label-md text-label-md text-on-surface mb-xs">
                  Currency
                </label>
                <select
                  id="currency_select"
                  className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="TZS">TZS</option>
                  <option value="KES">KES</option>
                  <option value="UGX">UGX</option>
                  <option value="RWF">RWF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                  Date Format
                </label>
                <select
                  className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                  Data Region
                </label>
                <select
                  className="w-full border border-outline-variant rounded px-md py-sm font-body-md bg-white"
                  value={dataRegion}
                  onChange={(e) => setDataRegion(e.target.value)}
                >
                  <option value="Africa-East">Africa-East</option>
                  <option value="Europe-West">Europe-West</option>
                  <option value="US-East">US-East</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 5: Subscription Setup */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="flex items-center justify-between mb-lg">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">card_membership</span>
                <h2 className="font-headline-sm text-headline-sm m-0">Subscription Setup</h2>
              </div>
              <div className="flex items-center gap-sm">
                <span className="font-label-sm text-label-sm text-secondary">Free Trial</span>
                <div 
                  onClick={() => setFreeTrial(!freeTrial)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-all duration-200 ${freeTrial ? 'bg-primary' : 'bg-surface-container-highest'}`}
                >
                  <div className={`absolute bg-white w-4 h-4 rounded-full transition-all duration-200 top-[2px] ${freeTrial ? 'left-[22px]' : 'left-[2px]'}`} />
                </div>
                {freeTrial && (
                  <span className="bg-[#e7f5ed] text-[#00875a] px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold">
                    30-day trial
                  </span>
                )}
              </div>
            </div>

            {/* Monthly / Annual Toggle Switch */}
            <div className="flex justify-center gap-md mb-xl">
              <span className={`font-label-md text-label-md transition-colors ${!isAnnual ? 'text-on-surface font-semibold' : 'text-secondary'}`}>
                Monthly
              </span>
              <div
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-10 h-5 bg-primary rounded-full relative cursor-pointer flex items-center"
              >
                <div className={`absolute bg-white w-4 h-4 rounded-full transition-all duration-200 top-[2px] ${isAnnual ? 'left-[22px]' : 'left-[2px]'}`} />
              </div>
              <span className={`font-label-md text-label-md transition-colors ${isAnnual ? 'text-on-surface font-semibold' : 'text-secondary'}`}>
                Annual
              </span>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-3 gap-md">
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.plan_id
                const price = isAnnual ? p.annual_price : p.monthly_price
                const priceSuffix = isAnnual ? '/yr' : '/mo'
                
                return (
                  <label key={p.plan_id} className="cursor-pointer group">
                    <input
                      type="radio"
                      name="plan"
                      className="hidden peer"
                      checked={isSelected}
                      onChange={() => setSelectedPlanId(p.plan_id)}
                    />
                    <div className={`h-full p-md rounded-lg flex flex-col items-center text-center transition-all ${
                      isSelected
                        ? 'border-2 border-solid border-primary bg-surface-container-low'
                        : 'border border-solid border-outline-variant hover:bg-surface-container-low bg-white'
                    }`}>
                      {p.plan_id === 'standard' && (
                        <div className="bg-primary text-white font-label-sm text-label-sm px-2 py-0.5 rounded-full mb-2">
                          Most Popular
                        </div>
                      )}
                      <span className="font-label-md text-label-md text-secondary mb-1 capitalize font-semibold">
                        {p.plan_name}
                      </span>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
                        {currency} {price}{typeof price === 'number' && price <= 1000 ? 'k' : ''}{priceSuffix}
                      </span>
                      {p.description && (
                        <p className="font-label-sm text-label-sm text-secondary mb-3 mt-0">
                          {p.description}
                        </p>
                      )}
                      
                      <div className="w-full border-t border-solid border-outline-variant my-2"></div>
                      
                      <ul className="text-left space-y-2 font-label-sm text-label-sm text-on-surface-variant p-0 m-0 list-none w-full">
                        <li className="flex items-start gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#00875a]">check</span>
                          {p.max_patients ? `Up to ${p.max_patients} Patients` : 'Unlimited Patients'}
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#00875a]">check</span>
                          {p.max_users ? `Up to ${p.max_users} Users` : 'Unlimited Users'}
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#00875a]">check</span>
                          {p.storage_gb} GB Storage
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#00875a]">check</span>
                          {p.uptime_sla_pct}% Uptime SLA
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#00875a]">check</span>
                          Backups every {p.backup_frequency_hours}h
                        </li>
                        {p.modules_included && p.modules_included.length > 0 && (
                          <li className="flex flex-col gap-1 pt-1">
                            <span className="font-semibold text-secondary">Modules:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.modules_included.map((mod, mIdx) => (
                                <span key={mIdx} className="bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">
                                  {mod}
                                </span>
                              ))}
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  </label>
                )
              })}
            </div>
          </section>

          {/* Section 6: Branding */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="flex items-center gap-2 mb-lg">
              <span className="material-symbols-outlined text-primary">branding_watermark</span>
              <h2 className="font-headline-sm text-headline-sm m-0">Branding</h2>
            </div>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-outline-variant rounded-lg p-xl flex flex-col items-center justify-center text-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoChange}
              />
              {logoFile ? (
                <div className="flex flex-col items-center">
                  <img
                    src={logoUrl}
                    alt="Preview"
                    className="w-20 h-20 object-contain mb-md rounded-lg border border-outline-variant"
                  />
                  <p className="font-body-md text-body-md font-semibold text-on-surface mb-0">
                    {logoFile.name}
                  </p>
                  <button
                    onClick={handleRemoveLogo}
                    className="mt-sm text-error font-label-sm text-label-sm hover:underline bg-transparent border-none p-0 cursor-pointer"
                    type="button"
                  >
                    Remove logo
                  </button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[48px] text-outline mb-md">cloud_upload</span>
                  <p className="font-body-md text-body-md font-semibold text-on-surface mb-0">
                    Drag and drop hospital logo
                  </p>
                  <p className="font-label-sm text-label-sm text-secondary mt-1 mb-0">
                    SVG, PNG, or JPG (max 2MB). Recommended 512x512px.
                  </p>
                  <button
                    className="mt-md text-primary font-label-md text-label-md hover:underline bg-transparent border-none p-0 cursor-pointer"
                    type="button"
                  >
                    Or browse files
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Bottom Action Bar */}
          <div className="fixed bottom-0 right-0 left-0 lg:left-[240px] bg-surface-container-lowest border-t border-outline-variant py-md z-50">
            <div className="max-w-[720px] mx-auto px-xl flex justify-between items-center">
              <div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-md py-2 border border-solid border-outline-variant rounded-lg text-secondary font-label-md text-label-md hover:bg-surface-container bg-white cursor-pointer transition-all whitespace-nowrap"
                  onClick={() => navigate('/master/tenants')}
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-3">
                {/* Save as Draft button — not implemented; no backend draft status or endpoint exists.
                <button
                  type="button"
                  className="px-md py-2 border border-solid border-primary text-primary rounded-lg font-label-md text-label-md hover:bg-primary-fixed bg-white cursor-pointer transition-all whitespace-nowrap"
                  onClick={() => toast.success('Tenant settings saved as draft.')}
                >
                  Save as Draft
                </button>
                */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-lg py-2 bg-[#00875a] text-white rounded-lg font-label-md text-label-md font-semibold hover:bg-[#006644] shadow-sm transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {isSubmitting ? 'Activating...' : 'Save and Activate'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
