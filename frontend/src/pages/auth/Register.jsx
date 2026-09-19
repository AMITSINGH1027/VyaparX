import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  UserPlus,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  KeyRound,
  MapPin,
  BriefcaseBusiness
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const BUSINESS_TYPES = [
  'Retail',
  'Wholesale',
  'Manufacturing',
  'Services',
  'Restaurant / Food',
  'E-commerce',
  'Grocery / Supermarket',
  'Clothing / Fashion',
  'Electronics',
  'Hardware',
  'Beauty / Salon',
  'Education',
  'Healthcare',
  'Other',
];

const INDUSTRIES = [
  'Retail & Shopping',
  'Wholesale & Distribution',
  'Manufacturing',
  'IT & Technology',
  'Food & Restaurant',
  'Grocery & Supermarket',
  'Clothing & Fashion',
  'Electronics',
  'Hardware & Construction',
  'Beauty & Salon',
  'Education',
  'Healthcare',
  'Professional Services',
  'E-commerce',
  'Other',
];

const initialForm = {
  role: 'owner',
  business_name: '',
  business_type: '',
  industry: '',
  business_email: '',
  business_phone: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
  unique_code: '',
  address: '',
  country: 'India',
  state: '',
  city: '',
  pincode: '',
};

export const Register = () => {
  const { setToken, setUser, setBusiness } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isOwner = formData.role === 'owner';

  const update = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const selectRole = (role) => {
    setError('');

    setFormData((prev) => ({
      ...prev,
      role,

      // Never carry owner business data into worker registration.
      ...(role === 'worker'
        ? {
            business_name: '',
            business_type: '',
            industry: '',
            business_email: '',
            business_phone: '',
            address: '',
            country: 'India',
            state: '',
            city: '',
            pincode: '',
          }
        : {
            unique_code: '',
          }),
    }));
  };

  const validate = () => {
    if (!formData.first_name.trim()) {
      return 'First name is required';
    }

    if (!formData.last_name.trim()) {
      return 'Last name is required';
    }

    if (!formData.email.trim()) {
      return 'Email is required';
    }

    if (formData.password !== formData.confirm_password) {
      return 'Passwords do not match';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (isOwner) {
      if (!formData.business_name.trim()) {
        return 'Business name is required';
      }

      if (!formData.business_type) {
        return 'Please select a business type';
      }

      if (!formData.industry) {
        return 'Please select your industry / business field';
      }

      if (!formData.business_phone.trim()) {
        return 'Business phone is required';
      }

      if (!formData.country) {
        return 'Country is required';
      }

      if (!formData.state.trim()) {
        return 'State is required';
      }

      if (!formData.city.trim()) {
        return 'City is required';
      }

      if (!/^\d{6}$/.test(formData.pincode)) {
        return 'PIN Code must be 6 digits';
      }
    } else {
      const businessCode = formData.unique_code.trim().toUpperCase();

      if (!businessCode) {
        return 'Business unique code is required';
      }

      // New VyaparX business-code format.
      if (!/^VYPR-\d{4}$/.test(businessCode)) {
        return 'Invalid Business Unique Code. Use format VYPR-0001';
      }
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
      };

      let res;

      if (isOwner) {
        res = await api.post('/auth/register', {
          ...payload,
          business_name: formData.business_name.trim(),
          business_type: formData.business_type,
          industry: formData.industry,
          business_email: formData.business_email.trim() || null,
          business_phone: formData.business_phone.trim(),
          address: formData.address.trim() || null,
          country: formData.country,
          state: formData.state.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
        });
      } else {
        // IMPORTANT:
        // Backend expects `business_code`.
        // Always send the new VYPR-XXXX code in uppercase.
        res = await api.post('/auth/register-worker', {
          ...payload,
          business_code: formData.unique_code.trim().toUpperCase(),
        });
      }

      setToken(res.data.access_token);
      setUser(res.data.user);
      setBusiness(res.data.business || null);

      localStorage.setItem(
        'vyaparx_token',
        res.data.access_token
      );

      localStorage.setItem(
        'vyaparx_refresh_token',
        res.data.refresh_token
      );

      localStorage.setItem(
        'vyaparx_user',
        JSON.stringify(res.data.user)
      );

      if (res.data.business) {
        localStorage.setItem(
          'vyaparx_business',
          JSON.stringify(res.data.business)
        );
      } else {
        localStorage.removeItem('vyaparx_business');
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);

      setError(
        err.response?.data?.detail ||
          'Registration failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-700 bg-slate-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500';

  const labelClass =
    'block text-xs font-semibold text-slate-200 mb-1.5';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4">
      <div className="w-full max-w-3xl mx-auto">

        {/* Logo */}
        <div className="flex justify-center items-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <Store className="w-6 h-6" />
          </div>

          <span className="text-2xl font-black tracking-tight text-white">
            VyaparX
          </span>
        </div>

        {/* Heading */}
        <h2 className="mt-4 text-center text-2xl font-bold text-white">
          Create your business account
        </h2>

        <p className="mt-1 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-400 hover:text-brand-300"
          >
            Sign in
          </Link>
        </p>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl p-5 sm:p-7">

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-2">
              I am registering as
            </label>

            <div className="grid grid-cols-2 gap-3">

              {/* Owner */}
              <button
                type="button"
                onClick={() => selectRole('owner')}
                className={`h-12 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  isOwner
                    ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/30'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Business Owner
              </button>

              {/* Worker */}
              <button
                type="button"
                onClick={() => selectRole('worker')}
                className={`h-12 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  !isOwner
                    ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/30'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <User className="w-4 h-4" />
                Worker
              </button>

            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form
            className="mt-6 space-y-5"
            onSubmit={handleSubmit}
          >

            {/* OWNER FORM */}
            {isOwner ? (
              <>
                {/* Business Details */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">

                  <div className="flex items-center gap-2 text-white font-semibold text-sm mb-4">
                    <Building2 className="w-4 h-4 text-brand-400" />
                    Business Details
                  </div>

                  <div className="space-y-4">

                    {/* Business Name */}
                    <div>
                      <label className={labelClass}>
                        Business Name *
                      </label>

                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                        <input
                          required
                          value={formData.business_name}
                          onChange={(e) =>
                            update(
                              'business_name',
                              e.target.value
                            )
                          }
                          placeholder="Enter your business name"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      {/* Business Type */}
                      <div>
                        <label className={labelClass}>
                          Business Type *
                        </label>

                        <select
                          required
                          value={formData.business_type}
                          onChange={(e) =>
                            update(
                              'business_type',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                        >
                          <option value="">
                            Select business type
                          </option>

                          {BUSINESS_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Industry */}
                      <div>
                        <label className={labelClass}>
                          Industry / Business Field *
                        </label>

                        <div className="relative">
                          <BriefcaseBusiness className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                          <select
                            required
                            value={formData.industry}
                            onChange={(e) =>
                              update(
                                'industry',
                                e.target.value
                              )
                            }
                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                          >
                            <option value="">
                              Select your field
                            </option>

                            {INDUSTRIES.map((industry) => (
                              <option
                                key={industry}
                                value={industry}
                              >
                                {industry}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Business Contact & Location */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">

                  <div className="flex items-center gap-2 text-white font-semibold text-sm mb-4">
                    <MapPin className="w-4 h-4 text-brand-400" />
                    Business Contact & Location
                  </div>

                  <div className="space-y-4">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      {/* Business Email */}
                      <div>
                        <label className={labelClass}>
                          Business Email
                        </label>

                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                          <input
                            type="email"
                            value={formData.business_email}
                            onChange={(e) =>
                              update(
                                'business_email',
                                e.target.value
                              )
                            }
                            placeholder="business@example.com"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Business Phone */}
                      <div>
                        <label className={labelClass}>
                          Business Phone *
                        </label>

                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                          <input
                            required
                            type="tel"
                            value={formData.business_phone}
                            onChange={(e) =>
                              update(
                                'business_phone',
                                e.target.value
                              )
                            }
                            placeholder="Business phone number"
                            className={inputClass}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Address */}
                    <div>
                      <label className={labelClass}>
                        Business Address
                      </label>

                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                        <input
                          value={formData.address}
                          onChange={(e) =>
                            update(
                              'address',
                              e.target.value
                            )
                          }
                          placeholder="Business address"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Country + State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <div>
                        <label className={labelClass}>
                          Country *
                        </label>

                        <input
                          required
                          value={formData.country}
                          onChange={(e) =>
                            update(
                              'country',
                              e.target.value
                            )
                          }
                          placeholder="Country"
                          className={inputClass.replace(
                            'pl-9',
                            'px-3'
                          )}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          State *
                        </label>

                        <input
                          required
                          value={formData.state}
                          onChange={(e) =>
                            update(
                              'state',
                              e.target.value
                            )
                          }
                          placeholder="State"
                          className={inputClass.replace(
                            'pl-9',
                            'px-3'
                          )}
                        />
                      </div>

                    </div>

                    {/* City + PIN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <div>
                        <label className={labelClass}>
                          City *
                        </label>

                        <input
                          required
                          value={formData.city}
                          onChange={(e) =>
                            update(
                              'city',
                              e.target.value
                            )
                          }
                          placeholder="City"
                          className={inputClass.replace(
                            'pl-9',
                            'px-3'
                          )}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          PIN Code *
                        </label>

                        <input
                          required
                          inputMode="numeric"
                          maxLength={6}
                          value={formData.pincode}
                          onChange={(e) =>
                            update(
                              'pincode',
                              e.target.value
                                .replace(/\D/g, '')
                                .slice(0, 6)
                            )
                          }
                          placeholder="6-digit PIN"
                          className={inputClass.replace(
                            'pl-9',
                            'px-3'
                          )}
                        />
                      </div>

                    </div>

                  </div>
                </div>
              </>
            ) : (

              /* WORKER FORM */
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">

                <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
                  <KeyRound className="w-4 h-4 text-brand-400" />
                  Worker Registration
                </div>

                <p className="text-xs text-slate-400 mb-4">
                  Enter the unique code provided by your business
                  owner to join their business.
                </p>

                <label className={labelClass}>
                  Business Unique Code *
                </label>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                  <input
                    required
                    name="business_unique_code"
                    type="text"
                    value={formData.unique_code}
                    onChange={(e) =>
                      update(
                        'unique_code',
                        e.target.value
                          .toUpperCase()
                          .replace(/\s/g, '')
                      )
                    }
                    placeholder="VYPR-0001"
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={9}
                    className={inputClass}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Example: VYPR-0001
                </p>

              </div>
            )}

            {/* First + Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>
                <label className={labelClass}>
                  First Name *
                </label>

                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                  <input
                    required
                    value={formData.first_name}
                    onChange={(e) =>
                      update(
                        'first_name',
                        e.target.value
                      )
                    }
                    placeholder="First Name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Last Name *
                </label>

                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                  <input
                    required
                    value={formData.last_name}
                    onChange={(e) =>
                      update(
                        'last_name',
                        e.target.value
                      )
                    }
                    placeholder="Last Name"
                    className={inputClass}
                  />
                </div>
              </div>

            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>
                Email Address *
              </label>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    update(
                      'email',
                      e.target.value
                    )
                  }
                  placeholder="Enter your email"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>
                Phone Number
              </label>

              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    update(
                      'phone',
                      e.target.value
                    )
                  }
                  placeholder="Enter your phone number"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>
                <label className={labelClass}>
                  Password *
                </label>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      update(
                        'password',
                        e.target.value
                      )
                    }
                    placeholder="Enter password"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Confirm Password *
                </label>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                  <input
                    required
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) =>
                      update(
                        'confirm_password',
                        e.target.value
                      )
                    }
                    placeholder="Confirm password"
                    className={inputClass}
                  />
                </div>
              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? 'Creating Account...'
                : isOwner
                  ? 'Register Business Account'
                  : 'Register as Worker'}

              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;