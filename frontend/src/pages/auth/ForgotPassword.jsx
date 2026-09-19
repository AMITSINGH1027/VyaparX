import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-surface-900 py-8 px-6 sm:px-10 shadow-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your email and we'll send you recovery instructions.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-300">
                If an account exists for <strong>{email}</strong>, a reset token has been generated.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-bold mt-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                {loading ? 'Submitting...' : 'Send Reset Link'}
              </button>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
