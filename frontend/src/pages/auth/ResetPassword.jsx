import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Store,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

import api from '../../api/client';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!token) {
      setError('Invalid or missing password reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: password,
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'This reset link is invalid or has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050816] text-white">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 vx-grid opacity-[0.12]" />

        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-purple-600/20 blur-[110px] vx-pulse" />

        <div className="absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[110px] vx-pulse-delay" />

        <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.08] blur-[90px]" />

        <span className="absolute left-[12%] top-[20%] h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,.9)] vx-float" />

        <span className="absolute right-[15%] top-[28%] h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,.9)] vx-float-two" />

        <span className="absolute bottom-[20%] left-[18%] h-1 w-1 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,.9)] vx-float-two" />

        <span className="absolute bottom-[18%] right-[20%] h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,.9)] vx-float" />
      </div>

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-3 sm:px-8">
        <Link to="/login" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 shadow-[0_0_22px_rgba(139,92,246,.18)]">
            <Store className="relative z-10 h-5 w-5 text-purple-300 transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 rounded-xl bg-purple-500/10 blur-md" />
          </div>

          <div>
            <div className="text-sm font-black tracking-wide">
              Vyapar<span className="text-purple-400">X</span>
            </div>

            <div className="text-[8px] uppercase tracking-[0.18em] text-slate-500">
              Business Intelligence
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-slate-500 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Secure Recovery
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-16 pb-6">
        <div className="w-full max-w-[430px]">

          {/* Title */}
          <div className="mb-3 text-center vx-fade-up">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 shadow-[0_0_28px_rgba(139,92,246,.18)]">
              {submitted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <LockKeyhole className="h-5 w-5 text-purple-300" />
              )}
            </div>

            <div className="mb-1 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-purple-400">
              <Sparkles className="h-3 w-3" />
              Account Recovery
            </div>

            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {submitted ? 'Password Updated' : 'Create New Password'}
            </h1>

            <p className="mx-auto mt-1 max-w-[370px] text-[10px] leading-4 text-slate-400">
              {submitted
                ? 'Your VyaparX password has been updated successfully.'
                : 'Create a new secure password for your VyaparX account.'}
            </p>
          </div>

          {/* Card */}
          <div className="relative vx-fade-up">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-purple-500/25 via-blue-500/15 to-purple-500/25 blur-sm" />

            <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b1020]/95 shadow-[0_20px_60px_rgba(0,0,0,.55)] backdrop-blur-2xl">

              <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70" />

              <div className="p-5 sm:p-6">

                {!submitted ? (
                  <form onSubmit={handleSubmit}>

                    {/* New password */}
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-300">
                      New Password
                    </label>

                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-white/[0.10] bg-white/[0.035] py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-600 outline-none transition-all duration-300 hover:border-white/[0.18] focus:border-purple-500/60 focus:bg-purple-500/[0.04] focus:ring-4 focus:ring-purple-500/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Confirm password */}
                    <label className="mb-1.5 mt-4 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-300">
                      Confirm Password
                    </label>

                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-white/[0.10] bg-white/[0.035] py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-600 outline-none transition-all duration-300 hover:border-white/[0.18] focus:border-purple-500/60 focus:bg-purple-500/[0.04] focus:ring-4 focus:ring-purple-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[10px] leading-4 text-red-300">
                        {error}
                      </div>
                    )}

                    {/* Security info */}
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-500/10 bg-blue-500/[0.035] px-2.5 py-2">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />

                      <p className="text-[9px] leading-3.5 text-slate-400">
                        Use a strong password with at least 8 characters.
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-purple-400/30 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[0_8px_25px_rgba(124,58,237,.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(124,58,237,.38)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                      {loading ? (
                        <>
                          <Loader2 className="relative h-3.5 w-3.5 animate-spin" />
                          <span className="relative">Updating...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative">Update Password</span>
                          <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>

                    <div className="mt-3 text-center">
                      <Link
                        to="/login"
                        className="group inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 transition-colors hover:text-white"
                      >
                        <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1" />
                        Back to Login
                      </Link>
                    </div>
                  </form>
                ) : (
                  <div className="text-center">

                    <div className="vx-success mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 shadow-[0_0_30px_rgba(52,211,153,.12)]">
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    </div>

                    <h2 className="text-base font-black text-white">
                      Password Updated Successfully
                    </h2>

                    <p className="mx-auto mt-2 max-w-[330px] text-[10px] leading-4 text-slate-400">
                      Your password has been changed. You can now sign in
                      using your new password.
                    </p>

                    <Link
                      to="/login"
                      className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.035] px-4 py-2.5 text-[10px] font-bold text-slate-200 transition-all duration-300 hover:border-purple-500/40 hover:bg-purple-500/[0.06] hover:text-white"
                    >
                      Go to Login
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-2">
                <div className="flex items-center justify-center gap-1.5 text-[8px] uppercase tracking-[0.17em] text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,.8)]" />
                  VyaparX Secure Authentication
                </div>
              </div>
            </div>
          </div>

          <p className="mt-2 text-center text-[8px] uppercase tracking-[0.18em] text-slate-600">
            Manage • Grow • Go Beyond
          </p>
        </div>
      </main>

      <style>{`
        @keyframes vx-fade-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes vx-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes vx-float-two {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(8px) translateX(5px);
          }
        }

        @keyframes vx-pulse {
          0%, 100% {
            opacity: .45;
            transform: scale(1);
          }
          50% {
            opacity: .75;
            transform: scale(1.06);
          }
        }

        @keyframes vx-grid {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(32px, 32px);
          }
        }

        @keyframes vx-success {
          0% {
            opacity: 0;
            transform: scale(.75);
          }
          70% {
            transform: scale(1.06);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .vx-fade-up {
          animation: vx-fade-up .55s ease-out both;
        }

        .vx-float {
          animation: vx-float 4s ease-in-out infinite;
        }

        .vx-float-two {
          animation: vx-float-two 5s ease-in-out infinite;
        }

        .vx-pulse {
          animation: vx-pulse 5s ease-in-out infinite;
        }

        .vx-pulse-delay {
          animation: vx-pulse 6s ease-in-out infinite reverse;
        }

        .vx-grid {
          background-image:
            linear-gradient(
              rgba(139,92,246,.11) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(59,130,246,.09) 1px,
              transparent 1px
            );
          background-size: 32px 32px;
          animation: vx-grid 18s linear infinite;
        }

        .vx-success {
          animation: vx-success .5s cubic-bezier(.2,.8,.2,1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .vx-fade-up,
          .vx-float,
          .vx-float-two,
          .vx-pulse,
          .vx-pulse-delay,
          .vx-grid,
          .vx-success {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};