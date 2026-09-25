import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  UserRound,
  Building2,
  BriefcaseBusiness,
  Mail,
  Phone,
  Lock,
  MapPin,
  Globe2,
  Map,
  Hash,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Zap,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';

import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const Register = () => {
  const navigate = useNavigate();
  const { setToken, setUser, setBusiness } = useAuth();

  const [role, setRole] = useState('owner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
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

    business_unique_code: '',

    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const switchRole = (newRole) => {
    setRole(newRole);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!formData.first_name.trim()) {
      setError('First name is required.');
      return;
    }

    if (!formData.last_name.trim()) {
      setError('Last name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    if (role === 'owner') {
      if (!formData.business_name.trim()) {
        setError('Business / Company name is required.');
        return;
      }

      if (!formData.business_type) {
        setError('Please select a business type.');
        return;
      }

      if (!formData.industry.trim()) {
        setError('Industry / Business field is required.');
        return;
      }

      if (!formData.business_phone.trim()) {
        setError('Business phone is required.');
        return;
      }

      if (!formData.state.trim()) {
        setError('State is required.');
        return;
      }

      if (!formData.city.trim()) {
        setError('City is required.');
        return;
      }

      if (!/^\\d{6}$/.test(formData.pincode)) {
        setError('PIN Code must be 6 digits.');
        return;
      }
    } else if (!formData.business_unique_code.trim()) {
      setError('Business unique code is required.');
      return;
    }

    setLoading(true);

    try {
      let response;

      if (role === 'owner') {
        response = await api.post('/auth/register', {
          business_name: formData.business_name,
          business_type: formData.business_type,
          industry: formData.industry,

          business_email: formData.business_email,
          business_phone: formData.business_phone,

          address: formData.address,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,

          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,

          password: formData.password,
        });
      } else {
        response = await api.post('/auth/register-worker', {
          business_unique_code:
            formData.business_unique_code,

          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,

          password: formData.password,
        });
      }

      if (response.data?.access_token) {
        setToken(response.data.access_token);

        localStorage.setItem(
          'vyaparx_token',
          response.data.access_token
        );
      }

      if (response.data?.refresh_token) {
        localStorage.setItem(
          'vyaparx_refresh_token',
          response.data.refresh_token
        );
      }

      if (response.data?.user) {
        setUser(response.data.user);

        localStorage.setItem(
          'vyaparx_user',
          JSON.stringify(response.data.user)
        );
      }

      if (response.data?.business) {
        setBusiness(response.data.business);
        localStorage.setItem(
          'vyaparx_business',
          JSON.stringify(response.data.business)
        );
      } else {
        setBusiness(null);
        localStorage.removeItem('vyaparx_business');
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(' ')
        );
      } else {
        setError(
          detail ||
            err.response?.data?.message ||
            'Registration failed. Please check your details and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes register-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes register-left {
          from {
            opacity: 0;
            transform: translateX(-25px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes register-right {
          from {
            opacity: 0;
            transform: translateX(25px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes register-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes register-pulse {
          0%, 100% {
            opacity: .35;
            transform: scale(1);
          }
          50% {
            opacity: .8;
            transform: scale(1.25);
          }
        }

        @keyframes register-grid {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 65px 65px;
          }
        }

        @keyframes register-sweep {
          from {
            transform: translateX(-120%);
          }
          to {
            transform: translateX(120%);
          }
        }

        .register-up {
          animation: register-up .65s cubic-bezier(.22,1,.36,1) both;
        }

        .register-left {
          animation: register-left .75s cubic-bezier(.22,1,.36,1) both;
        }

        .register-right {
          animation: register-right .75s cubic-bezier(.22,1,.36,1) both;
        }

        .register-delay-1 {
          animation-delay: .08s;
        }

        .register-delay-2 {
          animation-delay: .16s;
        }

        .register-delay-3 {
          animation-delay: .24s;
        }

        .register-delay-4 {
          animation-delay: .32s;
        }

        .register-float {
          animation: register-float 4s ease-in-out infinite;
        }

        .register-pulse {
          animation: register-pulse 2.5s ease-in-out infinite;
        }

        .register-grid {
          animation: register-grid 18s linear infinite;
        }

        .register-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.14),
            transparent
          );
          transform: translateX(-120%);
        }

        button:hover .register-sweep {
          animation: register-sweep .7s ease;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="min-h-screen w-full overflow-x-hidden bg-[#020617] text-white">

        {/* BACKGROUND */}

        <div className="fixed inset-0 pointer-events-none overflow-hidden">

          <div className="absolute -top-52 -left-52 h-[550px] w-[550px] rounded-full bg-violet-600/10 blur-[140px]" />

          <div className="absolute top-[35%] -right-52 h-[550px] w-[550px] rounded-full bg-blue-600/10 blur-[140px]" />

          <div className="absolute -bottom-60 left-[30%] h-[450px] w-[550px] rounded-full bg-purple-600/10 blur-[140px]" />

          <div
            className="register-grid absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(99,102,241,.7) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99,102,241,.7) 1px, transparent 1px)
              `,
              backgroundSize: '65px 65px',
            }}
          />

          <div className="register-pulse absolute left-[10%] top-[20%] h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_15px_5px_rgba(139,92,246,.4)]" />

          <div className="register-pulse absolute right-[12%] top-[30%] h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_15px_5px_rgba(59,130,246,.4)]" />

        </div>

        {/* PAGE */}

        <div className="relative z-10 min-h-screen">

          <div className="mx-auto w-full max-w-[1450px] px-4 py-4 sm:px-6 lg:px-8">

            {/* HEADER */}

            <header className="flex h-12 items-center justify-between">

              <Link
                to="/"
                className="register-left flex items-center gap-2.5"
              >

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">

                  <Store className="h-4 w-4" />

                </div>

                <div className="text-xl font-black">

                  Vyapar<span className="text-violet-500">X</span>

                </div>

              </Link>

              <div className="hidden items-center gap-2 text-[10px] text-slate-600 sm:flex">

                <Sparkles className="h-3.5 w-3.5 text-violet-400" />

                One Platform · Infinite Possibilities

              </div>

            </header>

            {/* CONTENT */}

            <div className="mt-3 grid items-start gap-6 lg:grid-cols-[.72fr_1.28fr] xl:gap-10">

              {/* LEFT */}

              <section className="hidden lg:flex lg:min-h-[700px] lg:flex-col lg:justify-center register-left">

                <div className="max-w-md">

                  <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-wider text-violet-400">

                    <span className="h-px w-7 bg-violet-500" />

                    BUILD YOUR BUSINESS SMARTER

                  </div>

                  <h1 className="text-5xl font-black leading-[.95] xl:text-6xl">

                    Your Business.
                    <br />

                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                      Your Future.
                    </span>

                  </h1>

                  <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">

                    Join VyaparX and manage your business,
                    team and operations from one intelligent
                    platform.

                  </p>

                  <div className="mt-8 space-y-4">

                    <Benefit
                      icon={<Zap />}
                      title="AI-Powered Insights"
                      text="Make smarter business decisions."
                    />

                    <Benefit
                      icon={<BarChart3 />}
                      title="Powerful Analytics"
                      text="Track performance and growth."
                    />

                    <Benefit
                      icon={<ClipboardCheck />}
                      title="Simplified Operations"
                      text="Manage everyday work efficiently."
                    />

                    <Benefit
                      icon={<ShieldCheck />}
                      title="Trusted & Secure"
                      text="Keep your business data protected."
                    />

                  </div>

                  <div className="register-float mt-8 rounded-2xl border border-white/[.07] bg-slate-900/50 p-5 backdrop-blur-xl">

                    <p className="text-sm italic text-slate-400">

                      "A better business
                      <span className="text-violet-400">
                        {' '}starts here.
                      </span>"

                    </p>

                  </div>

                </div>

              </section>

              {/* RIGHT */}

              <section className="register-right mx-auto w-full max-w-[760px]">

                {/* TITLE */}

                <div className="mb-4 text-center">

                  <div className="mb-2 flex items-center justify-center gap-2 lg:hidden">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">

                      <Store className="h-4 w-4" />

                    </div>

                    <span className="text-lg font-black">

                      Vyapar<span className="text-violet-500">X</span>

                    </span>

                  </div>

                  <h2 className="text-2xl font-black sm:text-3xl">

                    Create your business account

                  </h2>

                  <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">

                    Already registered?{' '}

                    <Link
                      to="/login"
                      className="font-semibold text-violet-400 hover:text-violet-300"
                    >
                      Sign in
                    </Link>

                  </p>

                </div>

                {/* CARD */}

                <div className="relative">

                  <div className="absolute -inset-1 rounded-[25px] bg-gradient-to-r from-violet-600/15 via-purple-500/10 to-blue-600/15 blur-xl" />

                  <div className="relative rounded-[20px] border border-white/[.08] bg-slate-900/80 p-4 shadow-2xl backdrop-blur-2xl sm:p-5">

                    {/* ROLE */}

                    <div className="register-up mb-4">

                      <p className="mb-2 text-[10px] font-semibold text-slate-400">
                        I am registering as
                      </p>

                      <div className="grid grid-cols-2 gap-2">

                        <RoleButton
                          active={role === 'owner'}
                          icon={<Building2 />}
                          text="Business Owner"
                          onClick={() =>
                            switchRole('owner')
                          }
                        />

                        <RoleButton
                          active={role === 'worker'}
                          icon={<UserRound />}
                          text="Worker"
                          onClick={() =>
                            switchRole('worker')
                          }
                        />

                      </div>

                    </div>

                    {/* ERROR */}

                    {error && (

                      <div className="register-up mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-[11px] text-red-300">

                        {error}

                      </div>

                    )}

                    {/* =================================================
                        OWNER
                    ================================================== */}

                    {role === 'owner' && (

                      <form
                        onSubmit={handleSubmit}
                        className="space-y-3"
                      >

                        <FormSection
                          icon={<Building2 />}
                          title="Business Details"
                          delay="register-delay-1"
                        >

                          <InputField
                            label="Business Name"
                            icon={<Building2 />}
                            required
                            value={formData.business_name}
                            onChange={(value) =>
                              updateField(
                                'business_name',
                                value
                              )
                            }
                            placeholder="Enter your business name"
                          />

                          <div className="grid grid-cols-2 gap-2">

                            <SelectField
                              label="Business Type"
                              icon={<Store />}
                              required
                              value={formData.business_type}
                              onChange={(value) =>
                                updateField(
                                  'business_type',
                                  value
                                )
                              }
                              options={[
                                'Retail',
                                'Wholesale',
                                'Manufacturing',
                                'Service',
                                'Restaurant',
                                'Other',
                              ]}
                            />

                            <InputField
                              label="Industry / Business Field"
                              icon={<BriefcaseBusiness />}
                              required
                              value={formData.industry}
                              onChange={(value) =>
                                updateField(
                                  'industry',
                                  value
                                )
                              }
                              placeholder="Select your field"
                            />

                          </div>

                        </FormSection>

                        <FormSection
                          icon={<MapPin />}
                          title="Business Contact & Location"
                          delay="register-delay-2"
                        >

                          <div className="grid grid-cols-2 gap-2">

                            <InputField
                              label="Business Email"
                              icon={<Mail />}
                              type="email"
                              value={formData.business_email}
                              onChange={(value) =>
                                updateField(
                                  'business_email',
                                  value
                                )
                              }
                              placeholder="business@example.com"
                            />

                            <InputField
                              label="Business Phone"
                              icon={<Phone />}
                              value={formData.business_phone}
                              onChange={(value) =>
                                updateField(
                                  'business_phone',
                                  value
                                )
                              }
                              placeholder="Business phone number"
                            />

                          </div>

                          <InputField
                            label="Business Address"
                            icon={<MapPin />}
                            value={formData.address}
                            onChange={(value) =>
                              updateField(
                                'address',
                                value
                              )
                            }
                            placeholder="Business address"
                          />

                          <div className="grid grid-cols-3 gap-2">

                            <InputField
                              label="Country"
                              icon={<Globe2 />}
                              value={formData.country}
                              onChange={(value) =>
                                updateField(
                                  'country',
                                  value
                                )
                              }
                              placeholder="India"
                            />

                            <InputField
                              label="State"
                              icon={<Map />}
                              required
                              value={formData.state}
                              onChange={(value) =>
                                updateField(
                                  'state',
                                  value
                                )
                              }
                              placeholder="State"
                            />

                            <InputField
                              label="City"
                              icon={<MapPin />}
                              required
                              value={formData.city}
                              onChange={(value) =>
                                updateField(
                                  'city',
                                  value
                                )
                              }
                              placeholder="City"
                            />

                          </div>

                          <InputField
                            label="PIN Code"
                            icon={<Hash />}
                            required
                            value={formData.pincode}
                            onChange={(value) =>
                              updateField(
                                'pincode',
                                value
                              )
                            }
                            placeholder="6-digit PIN"
                            maxLength={6}
                          />

                        </FormSection>

                        <FormSection
                          icon={<UserRound />}
                          title="Account Information"
                          delay="register-delay-3"
                        >

                          <div className="grid grid-cols-2 gap-2">

                            <InputField
                              label="First Name"
                              icon={<UserRound />}
                              required
                              value={formData.first_name}
                              onChange={(value) =>
                                updateField(
                                  'first_name',
                                  value
                                )
                              }
                              placeholder="First Name"
                            />

                            <InputField
                              label="Last Name"
                              icon={<UserRound />}
                              required
                              value={formData.last_name}
                              onChange={(value) =>
                                updateField(
                                  'last_name',
                                  value
                                )
                              }
                              placeholder="Last Name"
                            />

                          </div>

                          <InputField
                            label="Email Address"
                            icon={<Mail />}
                            type="email"
                            required
                            value={formData.email}
                            onChange={(value) =>
                              updateField(
                                'email',
                                value
                              )
                            }
                            placeholder="Enter your email"
                          />

                          <InputField
                            label="Phone Number"
                            icon={<Phone />}
                            required
                            value={formData.phone}
                            onChange={(value) =>
                              updateField(
                                'phone',
                                value
                              )
                            }
                            placeholder="Enter your phone number"
                          />

                          <div className="grid grid-cols-2 gap-2">

                            <PasswordField
                              label="Password"
                              value={formData.password}
                              show={showPassword}
                              onToggle={() =>
                                setShowPassword(
                                  !showPassword
                                )
                              }
                              onChange={(value) =>
                                updateField(
                                  'password',
                                  value
                                )
                              }
                            />

                            <PasswordField
                              label="Confirm Password"
                              value={formData.confirm_password}
                              show={showConfirmPassword}
                              onToggle={() =>
                                setShowConfirmPassword(
                                  !showConfirmPassword
                                )
                              }
                              onChange={(value) =>
                                updateField(
                                  'confirm_password',
                                  value
                                )
                              }
                            />

                          </div>

                        </FormSection>

                        <SubmitButton
                          loading={loading}
                          text="Register Business Account"
                        />

                      </form>

                    )}

                    {/* =================================================
                        WORKER
                    ================================================== */}

                    {role === 'worker' && (

                      <form
                        onSubmit={handleSubmit}
                        className="space-y-3"
                      >

                        <FormSection
                          icon={<KeyRound />}
                          title="Worker Registration"
                          delay="register-delay-1"
                        >

                          <p className="mb-2 text-[9px] leading-relaxed text-slate-500">

                            Enter the unique code provided by
                            your business owner to join this
                            business.

                          </p>

                          <InputField
                            label="Business Unique Code"
                            icon={<KeyRound />}
                            required
                            value={
                              formData.business_unique_code
                            }
                            onChange={(value) =>
                              updateField(
                                'business_unique_code',
                                value
                              )
                            }
                            placeholder="VYPR-0001"
                          />

                          <p className="text-[9px] text-slate-600">
                            Example: VYPR-0001
                          </p>

                        </FormSection>

                        <FormSection
                          icon={<UserRound />}
                          title="Worker Account"
                          delay="register-delay-2"
                        >

                          <div className="grid grid-cols-2 gap-2">

                            <InputField
                              label="First Name"
                              icon={<UserRound />}
                              required
                              value={formData.first_name}
                              onChange={(value) =>
                                updateField(
                                  'first_name',
                                  value
                                )
                              }
                              placeholder="First Name"
                            />

                            <InputField
                              label="Last Name"
                              icon={<UserRound />}
                              required
                              value={formData.last_name}
                              onChange={(value) =>
                                updateField(
                                  'last_name',
                                  value
                                )
                              }
                              placeholder="Last Name"
                            />

                          </div>

                          <InputField
                            label="Email Address"
                            icon={<Mail />}
                            type="email"
                            required
                            value={formData.email}
                            onChange={(value) =>
                              updateField(
                                'email',
                                value
                              )
                            }
                            placeholder="Enter your email"
                          />

                          <InputField
                            label="Phone Number"
                            icon={<Phone />}
                            required
                            value={formData.phone}
                            onChange={(value) =>
                              updateField(
                                'phone',
                                value
                              )
                            }
                            placeholder="Enter your phone number"
                          />

                          <div className="grid grid-cols-2 gap-2">

                            <PasswordField
                              label="Password"
                              value={formData.password}
                              show={showPassword}
                              onToggle={() =>
                                setShowPassword(
                                  !showPassword
                                )
                              }
                              onChange={(value) =>
                                updateField(
                                  'password',
                                  value
                                )
                              }
                            />

                            <PasswordField
                              label="Confirm Password"
                              value={formData.confirm_password}
                              show={showConfirmPassword}
                              onToggle={() =>
                                setShowConfirmPassword(
                                  !showConfirmPassword
                                )
                              }
                              onChange={(value) =>
                                updateField(
                                  'confirm_password',
                                  value
                                )
                              }
                            />

                          </div>

                        </FormSection>

                        <SubmitButton
                          loading={loading}
                          text="Register as Worker"
                        />

                      </form>

                    )}

                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] text-slate-700">

                      <ShieldCheck className="h-3 w-3" />

                      Secure registration · VyaparX

                    </div>

                  </div>

                </div>

              </section>

            </div>

          </div>

        </div>

      </div>
    </>
  );
};

/* ===============================================================
   ROLE BUTTON
================================================================ */

const RoleButton = ({
  active,
  icon,
  text,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg border text-[11px] font-semibold transition-all duration-300 ${
        active
          ? 'border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-600/20'
          : 'border-slate-700 bg-slate-950/40 text-slate-400 hover:-translate-y-0.5 hover:border-violet-500/40'
      }`}
    >

      {active && <span className="register-sweep" />}

      {React.cloneElement(icon, {
        className:
          'relative h-3.5 w-3.5 transition-transform group-hover:scale-110',
      })}

      <span className="relative">
        {text}
      </span>

    </button>
  );
};

/* ===============================================================
   FORM SECTION
================================================================ */

const FormSection = ({
  icon,
  title,
  children,
  delay = '',
}) => {
  return (
    <div
      className={`register-up ${delay} rounded-xl border border-slate-800/90 bg-slate-950/30 p-3 transition-all duration-300 hover:border-violet-500/20`}
    >

      <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold text-slate-300">

        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">

          {React.cloneElement(icon, {
            className: 'h-3 w-3',
          })}

        </span>

        {title}

      </div>

      <div className="space-y-2">
        {children}
      </div>

    </div>
  );
};

/* ===============================================================
   INPUT
================================================================ */

const InputField = ({
  label,
  icon,
  type = 'text',
  required = false,
  value,
  onChange,
  placeholder,
  maxLength,
}) => {
  return (
    <div>

      <label className="mb-1 block text-[9px] font-semibold text-slate-400">

        {label}

        {required && (
          <span className="ml-0.5 text-violet-400">*</span>
        )}

      </label>

      <div className="group relative">

        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-violet-400">

          {React.cloneElement(icon, {
            className: 'h-3.5 w-3.5',
          })}

        </span>

        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          maxLength={maxLength}
          className="h-9 w-full rounded-lg border border-slate-700/80 bg-slate-950/60 pl-9 pr-3 text-[10px] text-white outline-none transition-all duration-300 placeholder:text-slate-700 focus:-translate-y-[1px] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
        />

      </div>

    </div>
  );
};

/* ===============================================================
   SELECT
================================================================ */

const SelectField = ({
  label,
  icon,
  required,
  value,
  onChange,
  options,
}) => {
  return (
    <div>

      <label className="mb-1 block text-[9px] font-semibold text-slate-400">

        {label}

        {required && (
          <span className="ml-0.5 text-violet-400">*</span>
        )}

      </label>

      <div className="group relative">

        <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-600">

          {React.cloneElement(icon, {
            className: 'h-3.5 w-3.5',
          })}

        </span>

        <select
          required={required}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="h-9 w-full appearance-none rounded-lg border border-slate-700/80 bg-slate-950/60 pl-9 pr-8 text-[10px] text-slate-300 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
        >

          <option value="" className="bg-slate-900">
            Select business type
          </option>

          {options.map((option) => (
            <option
              key={option}
              value={option}
              className="bg-slate-900"
            >
              {option}
            </option>
          ))}

        </select>

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-slate-600">
          ▼
        </span>

      </div>

    </div>
  );
};

/* ===============================================================
   PASSWORD
================================================================ */

const PasswordField = ({
  label,
  value,
  show,
  onToggle,
  onChange,
}) => {
  return (
    <div>

      <label className="mb-1 block text-[9px] font-semibold text-slate-400">

        {label}

        <span className="ml-0.5 text-violet-400">
          *
        </span>

      </label>

      <div className="group relative">

        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400" />

        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder="Enter password"
          className="h-9 w-full rounded-lg border border-slate-700/80 bg-slate-950/60 pl-9 pr-9 text-[10px] text-white outline-none transition-all duration-300 placeholder:text-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-violet-400"
        >

          {show ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}

        </button>

      </div>

    </div>
  );
};

/* ===============================================================
   SUBMIT BUTTON
================================================================ */

const SubmitButton = ({
  loading,
  text,
}) => {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition-all duration-300 hover:scale-[1.005] hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
    >

      <span className="register-sweep" />

      <span className="relative">

        {loading
          ? 'Creating Account...'
          : text}

      </span>

      {!loading && (
        <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
      )}

    </button>
  );
};

/* ===============================================================
   BENEFIT
================================================================ */

const Benefit = ({
  icon,
  title,
  text,
}) => {
  return (
    <div className="flex items-center gap-3 transition-transform duration-300 hover:translate-x-2">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/10 text-violet-400">

        {React.cloneElement(icon, {
          className: 'h-4 w-4',
        })}

      </div>

      <div>

        <p className="text-xs font-bold text-slate-300">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-600">
          {text}
        </p>

      </div>

    </div>
  );
};