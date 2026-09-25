import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  Store,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  BarChart3,
  Settings,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Activity,
} from 'lucide-react';

import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, setUser, setBusiness } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const idToken = credentialResponse?.credential;

      if (!idToken) {
        throw new Error('Google authentication token was not received.');
      }

      const res = await api.post('/auth/social-login', {
        provider: 'google',
        id_token: idToken,
      });

      const {
        access_token,
        refresh_token,
        user: loggedUser,
        business: biz,
      } = res.data;

      localStorage.setItem('vyaparx_token', access_token);
      localStorage.setItem(
        'vyaparx_refresh_token',
        refresh_token
      );
      localStorage.setItem(
        'vyaparx_user',
        JSON.stringify(loggedUser)
      );

      if (biz) {
        localStorage.setItem(
          'vyaparx_business',
          JSON.stringify(biz)
        );
        setBusiness(biz);
      } else {
        localStorage.removeItem('vyaparx_business');
        setBusiness(null);
      }

      setUser(loggedUser);

      // New Google users do not have a business yet.
      // Send them to Business Setup before opening the dashboard.
      if (biz) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Google sign-in failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(
      'Google sign-in was cancelled or failed. Please try again.'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const authData = await login(email, password);
      const loggedUser = authData?.user;
      const biz = authData?.business;

      if (loggedUser?.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (biz) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to sign in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes vx-fade-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes vx-fade-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes vx-fade-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes vx-float {
          0%, 100% {
            transform: translateY(0) rotate(-3deg);
          }
          50% {
            transform: translateY(-8px) rotate(-1deg);
          }
        }

        @keyframes vx-float-two {
          0%, 100% {
            transform: translateY(0) rotate(2deg);
          }
          50% {
            transform: translateY(-10px) rotate(4deg);
          }
        }

        @keyframes vx-pulse {
          0%, 100% {
            opacity: .35;
            transform: scale(1);
          }
          50% {
            opacity: .8;
            transform: scale(1.25);
          }
        }

        @keyframes vx-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139,92,246,.10);
          }
          50% {
            box-shadow: 0 0 40px rgba(139,92,246,.25);
          }
        }

        @keyframes vx-sweep {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }

        @keyframes vx-grid {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 65px 65px;
          }
        }

        @keyframes vx-chart {
          from {
            transform: scaleY(.35);
          }
          to {
            transform: scaleY(1);
          }
        }

        .vx-fade-up {
          animation: vx-fade-up .7s cubic-bezier(.22,1,.36,1) both;
        }

        .vx-fade-left {
          animation: vx-fade-left .8s cubic-bezier(.22,1,.36,1) both;
        }

        .vx-fade-right {
          animation: vx-fade-right .8s cubic-bezier(.22,1,.36,1) both;
        }

        .vx-delay-1 { animation-delay: .08s; }
        .vx-delay-2 { animation-delay: .16s; }
        .vx-delay-3 { animation-delay: .24s; }
        .vx-delay-4 { animation-delay: .32s; }

        .vx-float {
          animation: vx-float 4s ease-in-out infinite;
        }

        .vx-float-two {
          animation: vx-float-two 4.5s ease-in-out infinite;
        }

        .vx-pulse {
          animation: vx-pulse 2.5s ease-in-out infinite;
        }

        .vx-glow {
          animation: vx-glow 3s ease-in-out infinite;
        }

        .vx-grid {
          animation: vx-grid 18s linear infinite;
        }

        .vx-chart-bar {
          transform-origin: bottom;
          animation: vx-chart .9s cubic-bezier(.22,1,.36,1) both;
        }

        .vx-sweep-button {
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

        button:hover .vx-sweep-button {
          animation: vx-sweep .7s ease;
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

      <div className="h-screen w-full overflow-hidden bg-[#020617] text-white">

        {/* BACKGROUND */}

        <div className="fixed inset-0 pointer-events-none overflow-hidden">

          <div className="absolute -top-52 -left-52 h-[550px] w-[550px] rounded-full bg-violet-600/10 blur-[140px]" />

          <div className="absolute top-[30%] -right-52 h-[550px] w-[550px] rounded-full bg-blue-600/10 blur-[140px]" />

          <div className="absolute -bottom-60 left-[30%] h-[450px] w-[550px] rounded-full bg-purple-600/10 blur-[140px]" />

          <div
            className="vx-grid absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(99,102,241,.7) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99,102,241,.7) 1px, transparent 1px)
              `,
              backgroundSize: '65px 65px',
            }}
          />

          <div className="vx-pulse absolute left-[12%] top-[20%] h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_15px_5px_rgba(139,92,246,.4)]" />

          <div className="vx-pulse absolute right-[15%] top-[32%] h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_15px_5px_rgba(59,130,246,.4)]" />

          <div className="vx-pulse absolute left-[25%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_15px_5px_rgba(168,85,246,.4)]" />

        </div>

        {/* PAGE */}

        <div className="relative z-10 flex h-full flex-col">

          <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col px-5 lg:px-8">

            {/* HEADER */}

            <header className="flex h-[54px] shrink-0 items-center justify-between">

              <Link
                to="/"
                className="flex items-center gap-2.5 vx-fade-left"
              >

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">

                  <Store className="h-4 w-4" />

                </div>

                <div className="text-lg font-black">
                  Vyapar<span className="text-violet-500">X</span>
                </div>

              </Link>

              <div className="hidden items-center gap-2 text-[10px] text-slate-600 sm:flex vx-fade-right">

                <Sparkles className="h-3.5 w-3.5 text-violet-400" />

                AI-Powered Business Operations

              </div>

            </header>

            {/* MAIN */}

            <main className="flex min-h-0 flex-1 items-center">

              <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-[1.08fr_.92fr] xl:gap-10">

                {/* LEFT */}

                <section className="hidden lg:block vx-fade-left">

                  <div className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold tracking-wide text-violet-400">

                    <span className="h-px w-6 bg-violet-500" />

                    THE SMARTER WAY TO RUN YOUR BUSINESS

                  </div>

                  <h1 className="text-[46px] font-black leading-[.9] tracking-tight xl:text-[54px]">

                    Manage
                    <br />
                    Grow
                    <br />

                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                      Go Beyond.
                    </span>

                  </h1>

                  <p className="mt-4 max-w-[450px] text-sm leading-relaxed text-slate-400 xl:text-base">

                    AI-Powered Business Operations &
                    Intelligence Platform designed to help
                    modern businesses work smarter.

                  </p>

                  {/* FEATURE CARDS */}

                  <div className="relative mt-6 h-[205px]">

                    <div className="vx-float absolute left-0 top-0">

                      <FeatureCard
                        icon={<BarChart3 />}
                        title="Analytics"
                        subtitle="Smart insights"
                      />

                    </div>

                    <div
                      className="vx-float-two absolute left-[175px] top-[45px]"
                    >

                      <FeatureCard
                        icon={<Settings />}
                        title="Automation"
                        subtitle="Save your time"
                      />

                    </div>

                    <div
                      className="vx-float-two absolute right-[90px] top-0"
                    >

                      <FeatureCard
                        icon={<ShieldCheck />}
                        title="Security"
                        subtitle="Protected data"
                      />

                    </div>

                    <div
                      className="vx-float absolute right-0 bottom-0"
                    >

                      <FeatureCard
                        icon={<TrendingUp />}
                        title="Growth"
                        subtitle="Business insights"
                      />

                    </div>

                    {/* DASHBOARD */}

                    <div className="vx-float absolute bottom-0 left-[31%]">

                      <div className="relative h-[125px] w-[195px] rounded-2xl border border-violet-400/20 bg-slate-900/70 p-3 shadow-2xl backdrop-blur-xl">

                        <div className="h-full rounded-xl border border-white/[.07] bg-gradient-to-br from-slate-800 to-slate-950 p-3">

                          <div className="mb-2 flex justify-between">

                            <div>
                              <div className="mb-1 h-1.5 w-10 rounded bg-slate-600" />
                              <div className="h-1 w-14 rounded bg-slate-700" />
                            </div>

                            <Activity className="h-4 w-4 text-violet-400" />

                          </div>

                          <div className="flex h-[55px] items-end gap-2">

                            {[22, 34, 27, 50, 40, 46].map(
                              (height, index) => (
                                <div
                                  key={index}
                                  className="vx-chart-bar w-3 rounded-t bg-violet-500/60"
                                  style={{
                                    height: `${height}px`,
                                    animationDelay: `${index * 80}ms`,
                                  }}
                                />
                              )
                            )}

                          </div>

                        </div>

                        <div className="absolute -bottom-2 left-[-12px] right-[-12px] h-3 rounded-full bg-gradient-to-r from-slate-700 via-violet-800/50 to-slate-700" />

                      </div>

                    </div>

                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">

                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />

                    Built for smarter and more connected businesses

                  </div>

                </section>

                {/* RIGHT LOGIN */}

                <section className="mx-auto w-full max-w-[410px] vx-fade-right">

                  <div className="relative">

                    <div className="absolute -inset-1 rounded-[25px] bg-gradient-to-r from-violet-600/20 via-purple-500/10 to-blue-600/20 blur-xl" />

                    <div className="vx-glow relative rounded-[22px] border border-white/[.08] bg-slate-900/80 p-5 shadow-2xl backdrop-blur-2xl sm:p-6">

                      {/* LOGO */}

                      <div className="mb-4 text-center vx-fade-up">

                        <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">

                          <Store className="h-5 w-5" />

                        </div>

                        <h2 className="text-[21px] font-black">

                          Welcome back to Vyapar
                          <span className="text-violet-500">X</span>

                        </h2>

                        <p className="mt-1 text-[11px] text-slate-500">
                          Sign in to your account
                        </p>

                      </div>

                      {error && (

                        <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-[11px] text-red-300">
                          {error}
                        </div>

                      )}

                      <form
                        onSubmit={handleSubmit}
                        className="space-y-3"
                      >

                        {/* EMAIL */}

                        <div className="vx-fade-up vx-delay-1">

                          <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                            Email Address
                          </label>

                          <div className="group relative">

                            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-violet-400" />

                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) =>
                                setEmail(e.target.value)
                              }
                              placeholder="name@business.com"
                              autoComplete="email"
                              className="h-11 w-full rounded-lg border border-slate-700/80 bg-slate-950/70 pl-10 pr-3 text-xs text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                            />

                          </div>

                        </div>

                        {/* PASSWORD */}

                        <div className="vx-fade-up vx-delay-2">

                          <div className="mb-1 flex justify-between">

                            <label className="text-[11px] font-semibold text-slate-300">
                              Password
                            </label>

                            <Link
                              to="/forgot-password"
                              className="text-[10px] font-semibold text-violet-400 hover:text-violet-300"
                            >
                              Forgot password?
                            </Link>

                          </div>

                          <div className="group relative">

                            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400" />

                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={password}
                              onChange={(e) =>
                                setPassword(e.target.value)
                              }
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="h-11 w-full rounded-lg border border-slate-700/80 bg-slate-950/70 pl-10 pr-10 text-xs text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword(!showPassword)
                              }
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-400"
                            >

                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}

                            </button>

                          </div>

                        </div>

                        {/* REMEMBER */}

                        <div className="vx-fade-up vx-delay-3">

                          <label className="flex cursor-pointer items-center gap-2">

                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) =>
                                setRememberMe(e.target.checked)
                              }
                              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
                            />

                            <span className="text-[10px] text-slate-500">
                              Remember me
                            </span>

                          </label>

                        </div>

                        {/* LOGIN */}

                        <button
                          type="submit"
                          disabled={loading}
                          className="group relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-bold shadow-lg shadow-violet-600/20 transition-all duration-300 hover:scale-[1.01] hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
                        >

                          <span className="vx-sweep-button" />

                          <span className="relative">

                            {loading
                              ? 'Authenticating...'
                              : 'Sign In to Dashboard'}

                          </span>

                          {!loading && (
                            <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                          )}

                        </button>

                      </form>

                      {/* SOCIAL */}

                      <div className="my-4 flex items-center gap-3">

                        <div className="h-px flex-1 bg-slate-800" />

                        <span className="text-[9px] text-slate-600">
                          or continue with
                        </span>

                        <div className="h-px flex-1 bg-slate-800" />

                      </div>

                      <div className="grid grid-cols-2 gap-2.5">

                        <div className="flex h-9 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950/60">
                          <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap={false}
                            theme="filled_black"
                            size="medium"
                            text="continue_with"
                            shape="rectangular"
                            width="180"
                          />
                        </div>

                        <button
                          type="button"
                          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 text-[11px] font-semibold text-slate-400 transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:text-white"
                        >

                          <span className="grid grid-cols-2 gap-[1px]">
                            <span className="h-1.5 w-1.5 bg-red-500" />
                            <span className="h-1.5 w-1.5 bg-green-500" />
                            <span className="h-1.5 w-1.5 bg-blue-500" />
                            <span className="h-1.5 w-1.5 bg-yellow-500" />
                          </span>

                          Microsoft

                        </button>

                      </div>

                      {/* REGISTER */}

                      <div className="mt-4 text-center">

                        <p className="text-[10px] text-slate-600">

                          Don't have an account?{' '}

                          <Link
                            to="/register"
                            className="font-bold text-violet-400 transition-colors hover:text-violet-300"
                          >
                            Create Business Account
                          </Link>

                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[9px] text-slate-700">

                    <ShieldCheck className="h-3 w-3" />

                    Secure business authentication

                  </div>

                </section>

              </div>

            </main>

            <footer className="flex h-[24px] shrink-0 items-center justify-center text-[8px] text-slate-700">
              © {new Date().getFullYear()} VyaparX. All rights reserved.
            </footer>

          </div>

        </div>

      </div>
    </>
  );
};

const FeatureCard = ({ icon, title, subtitle }) => {
  return (
    <div className="w-[125px] rounded-xl border border-white/[.08] bg-slate-900/65 p-3 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-violet-500/30 hover:shadow-violet-500/10 xl:w-[135px]">

      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-300">

        {React.cloneElement(icon, {
          className: 'h-4 w-4',
        })}

      </div>

      <p className="text-[11px] font-bold text-white">
        {title}
      </p>

      <p className="mt-0.5 text-[9px] text-slate-600">
        {subtitle}
      </p>

    </div>
  );
};