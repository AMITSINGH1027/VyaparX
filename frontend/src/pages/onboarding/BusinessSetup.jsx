import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, ArrowLeft, Building2, MapPin, ReceiptText, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const BUSINESS_TYPES = [
  'Retail', 'Wholesale', 'Manufacturing', 'Services', 'Restaurant / Food',
  'E-commerce', 'Grocery / Supermarket', 'Clothing / Fashion', 'Electronics',
  'Hardware', 'Beauty / Salon', 'Education', 'Healthcare', 'Other'
];

const TAX_TYPES = ['GST Registered', 'Composition', 'Unregistered', 'Not Applicable'];

export const BusinessSetup = () => {
  const { user, setBusiness } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    business_type: '',
    industry: '',
    email: '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    tax_id_gst: '',
    pan: '',
    business_registration_number: '',
    tax_type: 'Not Applicable',
    currency: 'INR',
    currency_symbol: '₹',
    timezone: 'Asia/Kolkata',
  });

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const canContinue = useMemo(() => (
    formData.name.trim() &&
    formData.business_type &&
    formData.industry.trim() &&
    formData.country.trim() &&
    formData.state.trim() &&
    formData.city.trim() &&
    /^\d{6}$/.test(formData.pincode)
  ), [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canContinue) {
      setError('Please complete all required business and location fields.');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData, email: formData.email.trim() || null, phone: formData.phone.trim() || null };
      const res = await api.post('/business/', payload);
      setBusiness(res.data);
      localStorage.setItem('vyaparx_business', JSON.stringify(res.data));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create your business profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-950 flex items-center justify-center p-4 py-10">
      <div className="max-w-2xl w-full bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
        <div className="text-center mb-7">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-600 items-center justify-center text-white mb-3 shadow-lg shadow-brand-600/20">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Set up your business</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tell VyaparX what you do so your dashboard, inventory, sales and reports are configured correctly.</p>
        </div>

        <div className="flex items-center gap-2 mb-7">
          {[['1', 'Business'], ['2', 'Location & Tax']].map(([number, title], index) => {
            const active = step === index + 1;
            const complete = step > index + 1;
            return (
              <React.Fragment key={number}>
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${active || complete ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-surface-800 text-slate-400'}`}>
                    {complete ? <CheckCircle2 className="w-4 h-4" /> : number}
                  </div>
                  <span className={`text-xs font-semibold ${active ? 'text-brand-600' : 'text-slate-400'}`}>{title}</span>
                </div>
                {index === 0 && <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />}
              </React.Fragment>
            );
          })}
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><Building2 className="w-4 h-4 text-brand-600" /> Business details</div>

              <div>
                <label className={labelClass}>Business / Company Name *</label>
                <input className={inputClass} required value={formData.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Sharma Electronics" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Business Type *</label>
                  <select className={inputClass} required value={formData.business_type} onChange={(e) => update('business_type', e.target.value)}>
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Industry / Business Field *</label>
                  <input className={inputClass} required value={formData.industry} onChange={(e) => update('industry', e.target.value)} placeholder="e.g. Mobile & Computer Accessories" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Official Business Email</label>
                  <input type="email" className={inputClass} value={formData.email} onChange={(e) => update('email', e.target.value)} placeholder="contact@business.com" />
                </div>
                <div>
                  <label className={labelClass}>Business Phone</label>
                  <input type="tel" className={inputClass} value={formData.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 9876543210" />
                </div>
              </div>

              <button type="button" disabled={!canContinue} onClick={() => { setError(''); setStep(2); }} className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2">
                Continue to Location & Tax <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><MapPin className="w-4 h-4 text-brand-600" /> Location & tax details</div>

              <div>
                <label className={labelClass}>Business Address</label>
                <textarea rows="2" className={inputClass} value={formData.address} onChange={(e) => update('address', e.target.value)} placeholder="Shop / office address" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={labelClass}>Country *</label><input className={inputClass} required value={formData.country} onChange={(e) => update('country', e.target.value)} /></div>
                <div><label className={labelClass}>State *</label><input className={inputClass} required value={formData.state} onChange={(e) => update('state', e.target.value)} placeholder="Uttar Pradesh" /></div>
                <div><label className={labelClass}>City *</label><input className={inputClass} required value={formData.city} onChange={(e) => update('city', e.target.value)} placeholder="Noida" /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelClass}>PIN Code *</label><input inputMode="numeric" maxLength="6" className={inputClass} required value={formData.pincode} onChange={(e) => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="201301" /></div>
                <div><label className={labelClass}>Tax Type</label><select className={inputClass} value={formData.tax_type} onChange={(e) => update('tax_type', e.target.value)}>{TAX_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-900 dark:text-white"><ReceiptText className="w-4 h-4 text-brand-600" /> Tax registration (optional)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>GSTIN</label><input className={inputClass} value={formData.tax_id_gst} onChange={(e) => update('tax_id_gst', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" /></div>
                  <div><label className={labelClass}>PAN</label><input maxLength="10" className={inputClass} value={formData.pan} onChange={(e) => update('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" /></div>
                  <div className="sm:col-span-2"><label className={labelClass}>Business Registration Number</label><input className={inputClass} value={formData.business_registration_number} onChange={(e) => update('business_registration_number', e.target.value)} placeholder="Optional" /></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setError(''); setStep(1); }} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                <button type="submit" disabled={loading} className="flex-[2] py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2">
                  {loading ? 'Creating Business...' : 'Create Business & Launch'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
