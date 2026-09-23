'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { getGuards, saveGuards } from '@/lib/data';
import { Guard } from '@/lib/types';
import { generateGuardId, generateId, todayStr } from '@/lib/utils';
import CameraCaptureModal from '@/components/CameraCaptureModal';

const designations = [
  'Security Guard',
  'Senior Security Guard',
  'Head Guard',
  'Security Supervisor',
  'CCTV Operator',
  'Lady Guard',
  'Armed Guard',
  'Patrol Officer',
];

const popularSites = [
  'The Emerald Club, Jamnagar',
  'Kataria Builders, Rajkot',
  'Yash Pinnacle, Ahmedabad',
  'Reliance Commercial, Jamnagar',
  'Essar Bulk Terminal, Jamnagar',
  'Shree Digvijay Cement, Sikka',
  'Airavat Headquarters, Jamnagar',
];

const salaryPresets = [15000, 18000, 20000, 22000, 25000];

const experiencePresets = ['Fresher (No Prior Exp)', '1 Year Security Exp', '2-3 Years Exp', '5+ Years Senior Exp', 'Ex-Military / Police'];

// Field wrapper component defined outside page component to prevent remounts and focus loss
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

function FormField({
  id,
  label,
  error,
  isTouched,
  required,
  children,
  hint,
}: FormFieldProps) {
  const hasError = isTouched && !!error;
  const isValid = isTouched && !error;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-xs font-semibold text-gray-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        {isValid && (
          <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 animate-fade-in">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Valid
          </span>
        )}
      </div>

      <div className="relative">{children}</div>

      {hasError ? (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 animate-fade-in font-medium">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="text-gray-400 text-[11px] mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

export default function RegisterGuardPage() {
  const router = useRouter();
  const siteDatalistId = useId();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredGuardId, setRegisteredGuardId] = useState('');
  const [dbSyncSource, setDbSyncSource] = useState<'supabase' | 'local'>('local');

  // Photo states
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoSource, setPhotoSource] = useState<'live' | 'upload' | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Form values (including all user requested fields)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    dob: '',
    age: '',
    gender: 'Male' as Guard['gender'],
    designation: 'Security Guard',
    site: '',
    salary: '18000', // Payment
    joinDate: todayStr(),
    password: 'guard123',
    aadharNo: '',

    oldExperience: 'Fresher (No Prior Exp)',
    preferredShift: 'Day shift' as 'Day shift' | 'Night shift' | 'Rotational / Any',
    workType: 'Permanent work' as 'Permanent work' | 'Temporary work',
    remarks: '',
  });

  // Track which fields have been blurred/touched
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate age from DOB
  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const dobDate = new Date(dobString);
    if (isNaN(dobDate.getTime())) return null;
    const today = new Date();
    let computed = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      computed--;
    }
    return computed;
  };

  const currentAge = form.dob ? calculateAge(form.dob) : form.age ? Number(form.age) : null;

  // Field validation rules
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        if (!/^[A-Za-z\s.'-]+$/.test(value.trim())) return 'Name should contain only letters';
        return '';

      case 'phone': {
        const digits = value.replace(/\D/g, '');
        if (!digits) return 'Contact phone number is required';
        if (digits.length !== 10) return 'Must be exactly 10 digits';
        if (!/^[6-9]/.test(digits)) return 'Indian mobile must start with 6, 7, 8, or 9';
        return '';
      }

      case 'email':
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Enter a valid email address';
        }
        return '';

      case 'dob': {
        if (!value && !form.age) return 'Date of birth or age is required';
        if (value) {
          const age = calculateAge(value);
          if (age === null || age < 18) return 'Guard must be at least 18 years old';
          if (age > 65) return 'Maximum age limit is 65 years';
        }
        return '';
      }

      case 'age': {
        if (!value && !form.dob) return 'Age is required';
        if (value) {
          const n = Number(value);
          if (isNaN(n) || n < 18 || n > 65) return 'Age must be between 18 and 65 years';
        }
        return '';
      }

      case 'address':
        if (!value.trim()) return 'Residential address is required';
        if (value.trim().length < 8) return 'Address must be at least 8 characters';
        return '';

      case 'site':
        if (!value.trim()) return 'Site deployment is required';
        return '';

      case 'salary': {
        const num = Number(value);
        if (!value || isNaN(num) || num < 5000) return 'Payment must be at least ₹5,000';
        return '';
      }

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';

      case 'aadharNo': {
        const aadharDigits = value.replace(/\D/g, '');
        if (aadharDigits && aadharDigits.length !== 12) {
          return 'Aadhar must be exactly 12 digits';
        }
        return '';
      }

      default:
        return '';
    }
  };

  // Change handler with smart auto-formatting
  const handleChange = (field: string, rawValue: string) => {
    let cleanValue = rawValue;

    if (field === 'phone') {
      cleanValue = rawValue.replace(/\D/g, '').slice(0, 10);
    } else if (field === 'aadharNo') {
      const digits = rawValue.replace(/\D/g, '').slice(0, 12);
      cleanValue = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    } else if (field === 'age') {
      cleanValue = rawValue.replace(/\D/g, '').slice(0, 2);
    } else if (field === 'dob') {
      // Auto-sync age if DOB chosen
      const a = calculateAge(rawValue);
      if (a !== null) {
        setForm((prev) => ({ ...prev, age: a.toString() }));
      }
    }

    setForm((prev) => ({ ...prev, [field]: cleanValue }));

    if (touched[field]) {
      const err = validateField(field, cleanValue);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field as keyof typeof form] as string);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  // Photo handlers
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setPhotoSource('upload');
    };
    reader.readAsDataURL(file);
  };

  const handleLivePhotoCapture = (capturedDataUrl: string) => {
    setPhotoPreview(capturedDataUrl);
    setPhotoSource('live');
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setPhotoSource(null);
  };

  // Password generator
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#';
    let pwd = 'Arv@';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: pwd }));
    setErrors((prev) => ({ ...prev, password: '' }));
    setTouched((prev) => ({ ...prev, password: true }));
  };

  // Validate all fields before submission
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    Object.keys(form).forEach((key) => {
      newTouched[key] = true;
      const err = validateField(key, form[key as keyof typeof form] as string);
      if (err) newErrors[key] = err;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setLoading(true);

    try {
      const existing = getGuards();
      const newGuardId = generateGuardId(existing.map((g) => g.guardId));
      const newGuard: Guard = {
        id: generateId(),
        guardId: newGuardId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        dob: form.dob || '1995-01-01',
        age: form.age ? Number(form.age) : currentAge || undefined,
        gender: form.gender,
        designation: form.designation,
        site: form.site.trim(),
        salary: Number(form.salary),
        joinDate: form.joinDate,
        status: 'Active',
        password: form.password,
        photo: photoPreview || undefined,
        aadharNo: form.aadharNo.trim() || undefined,

        oldExperience: form.oldExperience.trim() || undefined,
        preferredShift: form.preferredShift,
        workType: form.workType,
        remarks: form.remarks.trim() || undefined,
      };

      // 1. Instant local storage cache
      saveGuards([...existing, newGuard]);
      setRegisteredGuardId(newGuardId);

      // 2. Persist to Supabase Database via API
      try {
        const res = await fetch('/api/guards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGuard),
        });
        const data = await res.json();
        if (data.source === 'supabase') {
          setDbSyncSource('supabase');
        } else {
          setDbSyncSource('local');
        }
      } catch (dbErr) {
        console.warn('Database sync notification:', dbErr);
        setDbSyncSource('local');
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  // Progress calculation
  const requiredFields = ['name', 'phone', 'address', 'site', 'salary', 'password'];
  const filledRequiredCount = requiredFields.filter((f) => {
    const val = form[f as keyof typeof form];
    return val && val.toString().trim().length > 0 && !validateField(f, val.toString());
  }).length;
  const progressPercent = Math.round((filledRequiredCount / requiredFields.length) * 100);

  // Success view
  if (success) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[65vh]">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 max-w-lg w-full text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#040936]/5 text-[#040936] text-xs font-bold font-mono">
              ASSIGNED ID: {registeredGuardId}
            </span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${dbSyncSource === 'supabase'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
            >
              {dbSyncSource === 'supabase' ? '⚡ Synced to Supabase DB' : '💾 Local Record Saved'}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Guard Registered Successfully!</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            <strong className="text-gray-800">{form.name}</strong> enrolled for{' '}
            <strong className="text-gray-800">{form.workType}</strong> ({form.preferredShift}) at{' '}
            <strong className="text-gray-800">{form.site}</strong>.
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Guard ID:</span>
              <span className="font-mono font-bold text-[#040936]">{registeredGuardId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Contact Number:</span>
              <span className="font-semibold text-gray-800">+91 {form.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Work Type / Shift:</span>
              <span className="font-semibold text-gray-800">{form.workType} · {form.preferredShift}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Payment:</span>
              <span className="font-bold text-[#040936]">₹{Number(form.salary).toLocaleString('en-IN')}/mo</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Portal Password:</span>
              <span className="font-mono font-semibold text-gray-800">{form.password}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setForm({
                  name: '',
                  phone: '',
                  email: '',
                  address: '',
                  dob: '',
                  age: '',
                  gender: 'Male',
                  designation: 'Security Guard',
                  site: '',
                  salary: '18000',
                  joinDate: todayStr(),
                  password: 'guard123',
                  aadharNo: '',

                  oldExperience: 'Fresher (No Prior Exp)',
                  preferredShift: 'Day shift',
                  workType: 'Permanent work',
                  remarks: '',
                });
                setTouched({});
                setErrors({});
                setPhotoPreview('');
                setPhotoSource(null);
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              + Register Another Guard
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/guards')}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold shadow-md hover:brightness-110 transition-all text-white"
              style={{ background: 'linear-gradient(135deg, #040936, #0a1147)' }}
            >
              View Guard Roster →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header with Progress Tracker */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#C9A84C] bg-[#040936]">
              AIRAVAT SECURITY
            </span>
            <span className="text-xs font-medium text-gray-400">Personnel Enrollment</span>
          </div>
          <h1 className="text-2xl font-black text-[#040936] tracking-tight">Security Guard Registration</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Fill in the details below. Live photograph, experience, shift, and payment parameters enabled.
          </p>
        </div>

        {/* Form Completion Meter */}
        <div className="bg-[#f8f9fc] border border-gray-200 rounded-2xl p-4 min-w-[220px]">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-gray-600">Form Readiness</span>
            <span className="text-[#040936] font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #C9A84C, #040936)',
              }}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
            <span>{filledRequiredCount} of {requiredFields.length} core fields</span>
            {progressPercent === 100 ? (
              <span className="text-emerald-600 font-bold">Ready to Submit ✓</span>
            ) : (
              <span className="text-amber-600 font-medium">Incomplete</span>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ─── SECTION 1: Personal Info, Photo & Government ID ──────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-[#040936] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white bg-[#040936]">
                1
              </span>
              Personal & Identification Information
            </h2>
            <span className="text-[11px] font-medium text-gray-400">* Indicates mandatory field</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 mb-6">
            {/* Live Photo Section */}
            <div className="flex flex-col items-center sm:items-start lg:w-48 shrink-0 pb-6 lg:pb-0 lg:border-r border-gray-100 lg:pr-6">
              <span className="text-xs font-semibold text-gray-700 mb-2">Live Photograph</span>

              <div className="relative mb-3">
                <div
                  className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center relative shadow-sm transition-all"
                  style={{
                    borderColor: photoPreview ? '#C9A84C' : '#d1d5db',
                    background: photoPreview ? '#000' : '#f8f9fc',
                  }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Guard Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-medium text-gray-400">No Photo Selected</span>
                    </div>
                  )}
                </div>

                {photoPreview && (
                  <span
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
                    style={{ background: photoSource === 'live' ? '#040936' : '#C9A84C' }}
                  >
                    {photoSource === 'live' ? '📸 LIVE WEBCAM' : '📁 UPLOADED'}
                  </span>
                )}
              </div>

              {/* Photo Controls */}
              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:shadow-md hover:brightness-110 active:scale-98"
                  style={{ background: 'linear-gradient(135deg, #040936, #16206c)' }}
                >
                  <svg className="w-4 h-4 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Live Photo
                </button>

                <div className="flex items-center gap-1.5 w-full">
                  <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1 text-[11px] font-medium py-2 px-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload File
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </label>

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors"
                      title="Clear photograph"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Core Fields Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* 1. Name */}
              <FormField
                id="field-name"
                label="Full Name"
                error={errors.name}
                isTouched={touched.name}
                required
              >
                <input
                  id="field-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`form-input ${touched.name && errors.name ? 'form-input-error' : touched.name && !errors.name ? 'form-input-valid' : ''}`}
                  placeholder="e.g. Ramesh Kumar Sharma"
                  autoComplete="name"
                />
              </FormField>

              {/* 2. Contact Phone */}
              <FormField
                id="field-phone"
                label="Contact Number (Phone)"
                error={errors.phone}
                isTouched={touched.phone}
                required
                hint="10-digit mobile number for communication"
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 border-r border-gray-300 pr-2">
                    +91
                  </span>
                  <input
                    id="field-phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    className={`form-input pl-14 ${touched.phone && errors.phone ? 'form-input-error' : touched.phone && !errors.phone ? 'form-input-valid' : ''}`}
                    placeholder="9876543210"
                    maxLength={10}
                    autoComplete="tel"
                  />
                </div>
              </FormField>

              {/* 3. Email Address */}
              <FormField
                id="field-email"
                label="Email Address"
                error={errors.email}
                isTouched={touched.email}
                hint="For communications and notifications"
              >
                <input
                  id="field-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`form-input ${touched.email && errors.email ? 'form-input-error' : touched.email && !errors.email && form.email ? 'form-input-valid' : ''}`}
                  placeholder="guard@airavatsecurity.in"
                  autoComplete="email"
                />
              </FormField>

              {/* 4. Age & Date of Birth */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  id="field-dob"
                  label="Date of Birth"
                  error={errors.dob}
                  isTouched={touched.dob}
                >
                  <input
                    id="field-dob"
                    type="date"
                    value={form.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    onBlur={() => handleBlur('dob')}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 65)).toISOString().split('T')[0]}
                    className={`form-input text-xs ${touched.dob && errors.dob ? 'form-input-error' : touched.dob && !errors.dob && form.dob ? 'form-input-valid' : ''}`}
                  />
                </FormField>

                <FormField
                  id="field-age"
                  label="Age (Years)"
                  error={errors.age}
                  isTouched={touched.age}
                  required
                >
                  <input
                    id="field-age"
                    type="number"
                    min={18}
                    max={65}
                    value={form.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    onBlur={() => handleBlur('age')}
                    placeholder="e.g. 28"
                    className={`form-input font-bold ${touched.age && errors.age ? 'form-input-error' : touched.age && !errors.age && form.age ? 'form-input-valid' : ''}`}
                  />
                </FormField>
              </div>

              {/* 5. Aadhar Card Number */}
              <FormField
                id="field-aadharNo"
                label="AadharCard Number"
                error={errors.aadharNo}
                isTouched={touched.aadharNo}
                hint="Auto-spaced 12-digit UIDAI number"
              >
                <input
                  id="field-aadharNo"
                  type="text"
                  inputMode="numeric"
                  value={form.aadharNo}
                  onChange={(e) => handleChange('aadharNo', e.target.value)}
                  onBlur={() => handleBlur('aadharNo')}
                  className={`form-input font-mono ${touched.aadharNo && errors.aadharNo ? 'form-input-error' : touched.aadharNo && !errors.aadharNo && form.aadharNo ? 'form-input-valid' : ''}`}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                />
              </FormField>

              {/* Gender */}
              <FormField id="field-gender" label="Gender" required>
                <select
                  id="field-gender"
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="form-input bg-white cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* 6. Address */}
          <div className="pt-4 border-t border-gray-100">
            <FormField
              id="field-address"
              label="Residential Address"
              error={errors.address}
              isTouched={touched.address}
              required
              hint="Full permanent or residential address"
            >
              <textarea
                id="field-address"
                rows={2}
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                className={`form-input resize-none ${touched.address && errors.address ? 'form-input-error' : touched.address && !errors.address ? 'form-input-valid' : ''}`}
                placeholder="e.g. Plot 12, Khodiyar Colony, Jamnagar, Gujarat - 361006"
              />
            </FormField>
          </div>
        </div>

        {/* ─── SECTION 2: Work Type, Shift, Experience & Payment ───────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-[#040936] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white bg-[#040936]">
                2
              </span>
              Employment, Shift & Payment Details
            </h2>
            <span className="text-xs text-gray-400">Operations & deployment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* 7. Work Type: Permanent work / Temporary work */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">
                Work Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['Permanent work', 'Temporary work'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, workType: type }))}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${form.workType === type
                      ? 'border-[#040936] bg-[#040936]/5 text-[#040936] shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    <div>
                      <p className="font-bold text-xs">{type}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {type === 'Permanent work' ? 'Full-time roster contract' : 'Short-term / relief duty'}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.workType === type ? 'border-[#040936] bg-[#040936]' : 'border-gray-300'}`}>
                      {form.workType === type && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Preferred Shift: Day shift / Night shift */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">
                Preferred Shift <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'Day shift', label: 'Day Shift', desc: '08:00 - 20:00', icon: '☀️' },
                  { id: 'Night shift', label: 'Night Shift', desc: '20:00 - 08:00', icon: '🌙' },
                  { id: 'Rotational / Any', label: 'Rotational', desc: 'Any Shift', icon: '🔄' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, preferredShift: s.id as typeof form.preferredShift }))}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${form.preferredShift === s.id
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#040936] shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    <span className="text-lg">{s.icon}</span>
                    <p className="font-bold text-xs mt-1">{s.label}</p>
                    <p className="text-[10px] text-gray-400">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* 9. Old Experience */}
            <div className="sm:col-span-2">
              <FormField
                id="field-oldExperience"
                label="Old Experience (Prior Security / Work Experience)"
                hint="Select preset or type custom past security company / military experience"
              >
                <input
                  id="field-oldExperience"
                  type="text"
                  value={form.oldExperience}
                  onChange={(e) => handleChange('oldExperience', e.target.value)}
                  className="form-input text-xs sm:text-sm font-medium"
                  placeholder="e.g. 2 Years at G4S Security or Fresher"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-400 font-semibold self-center">Presets:</span>
                  {experiencePresets.map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, oldExperience: exp }))}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${form.oldExperience === exp
                        ? 'bg-[#040936] text-white border-[#040936]'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#C9A84C]'
                        }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>

            {/* 10. Payment (Monthly Salary) */}
            <FormField
              id="field-salary"
              label="Payment / Monthly Salary (INR)"
              error={errors.salary}
              isTouched={touched.salary}
              required
            >
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black-900">
                  ₹
                </span>
                <input
                  id="field-salary"
                  type="number"
                  min={5000}
                  step={500}
                  value={form.salary}
                  onChange={(e) => handleChange('salary', e.target.value)}
                  onBlur={() => handleBlur('salary')}
                  className={`form-input font-semibold ${touched.salary && errors.salary ? 'form-input-error' : touched.salary && !errors.salary ? 'form-input-valid' : ''}`}
                  placeholder="18000"
                />
              </div>

              {/* Payment Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-gray-400 font-semibold self-center">Presets:</span>
                {salaryPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      handleChange('salary', amount.toString());
                      setTouched((prev) => ({ ...prev, salary: true }));
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors font-medium ${Number(form.salary) === amount
                      ? 'bg-[#C9A84C] text-[#040936] font-bold border-[#C9A84C]'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#C9A84C]'
                      }`}
                  >
                    ₹{amount.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Site Deployed */}
            <FormField
              id="field-site"
              label="Client Site Deployed"
              error={errors.site}
              isTouched={touched.site}
              required
            >
              <input
                id="field-site"
                type="text"
                list={siteDatalistId}
                value={form.site}
                onChange={(e) => handleChange('site', e.target.value)}
                onBlur={() => handleBlur('site')}
                className={`form-input ${touched.site && errors.site ? 'form-input-error' : touched.site && !errors.site ? 'form-input-valid' : ''}`}
                placeholder="Choose from list or type custom site..."
              />
              <datalist id={siteDatalistId}>
                {popularSites.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>

              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-gray-400 font-semibold self-center">Quick Select:</span>
                {popularSites.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      handleChange('site', s);
                      setTouched((prev) => ({ ...prev, site: true }));
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${form.site === s
                      ? 'bg-[#040936] text-white border-[#040936]'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#C9A84C]'
                      }`}
                  >
                    {s.split(',')[0]}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Designation */}
            <FormField id="field-designation" label="Designation / Role" required>
              <select
                id="field-designation"
                value={form.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                className="form-input bg-white cursor-pointer font-medium"
              >
                {designations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Official Join Date */}
            <FormField id="field-joinDate" label="Official Joining Date" required>
              <input
                id="field-joinDate"
                type="date"
                value={form.joinDate}
                onChange={(e) => handleChange('joinDate', e.target.value)}
                className="form-input"
              />
            </FormField>
          </div>

          {/* 11. Remarks */}
          <div className="pt-3 border-t border-gray-100">
            <FormField
              id="field-remarks"
              label="Remarks & Special Notes"
              hint="Any special instructions, uniform size, health notes, or background verification remarks"
            >
              <textarea
                id="field-remarks"
                rows={2}
                value={form.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="e.g. Uniform size L, Ex-military background verified, night vision operator"
                className="form-input resize-none"
              />
            </FormField>
          </div>
        </div>

        {/* ─── SECTION 3: Portal Credentials ──────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-[#040936] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white bg-[#040936]">
                3
              </span>
              Guard Portal Credentials & System ID
            </h2>
            <span className="text-xs text-gray-400">Self-service portal access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Auto ID Display */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Assigned Guard ID
              </label>
              <div className="form-input flex items-center justify-between font-mono text-sm bg-gray-100 border-gray-200 text-[#040936] font-bold cursor-not-allowed">
                <span>Auto-generated upon submission</span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#C9A84C]/20 text-[#040936] font-semibold">
                  NEXT SEQUENTIAL
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                E.g. GRD006, GRD007 (Used as Login ID)
              </p>
            </div>

            {/* Portal Password */}
            <FormField
              id="field-password"
              label="Guard Portal Password"
              error={errors.password}
              isTouched={touched.password}
              required
            >
              <div className="relative">
                <input
                  id="field-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`form-input font-mono pr-20 ${touched.password && errors.password ? 'form-input-error' : touched.password && !errors.password ? 'form-input-valid' : ''}`}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors text-xs font-semibold"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-gray-400">At least 6 characters</span>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-semibold text-[#040936] hover:text-[#C9A84C] transition-colors underline"
                >
                  ⚡ Generate Random
                </button>
              </div>
            </FormField>
          </div>
        </div>

        {/* ─── Actions Bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => router.push('/admin/guards')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            ← Cancel & Back to Guard Roster
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all fields in this form?')) {
                  setForm({
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    dob: '',
                    age: '',
                    gender: 'Male',
                    designation: 'Security Guard',
                    site: '',
                    salary: '18000',
                    joinDate: todayStr(),
                    password: 'guard123',
                    aadharNo: '',

                    oldExperience: 'Fresher (No Prior Exp)',
                    preferredShift: 'Day shift',
                    workType: 'Permanent work',
                    remarks: '',
                  });
                  setTouched({});
                  setErrors({});
                  setPhotoPreview('');
                  setPhotoSource(null);
                }
              }}
              className="px-4 py-3.5 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-xs font-semibold transition-colors"
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none sm:px-10 py-3.5 rounded-2xl text-xs font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #040936 0%, #16206c 100%)',
                boxShadow: '0 4px 15px rgba(4, 9, 54, 0.25)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeDasharray="60" strokeDashoffset="20" />
                  </svg>
                  Registering Guard...
                </span>
              ) : (
                'Enroll & Save Guard Record →'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Live Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleLivePhotoCapture}
      />
    </div>
  );
}