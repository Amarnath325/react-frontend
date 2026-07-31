import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import PublicNavbar from '../../components/Frontend/PublicNavbar';
import PublicFooter from '../../components/Frontend/PublicFooter';
import api from '../../services/api';

interface Plan {
  id: number; name: string; slug: string; description: string;
  monthly_price: number; quarterly_price: number; yearly_price: number;
  max_students: number; max_staff: number; features: any; is_popular: boolean;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    api.get('/public/pricing')
      .then(res => { if (res.data.success && Array.isArray(res.data.data)) setPlans(res.data.data); })
      .catch(() => {
        setPlans([
          { id: 1, name: 'Free Trial', slug: 'free', description: 'Basic tier for small schools', monthly_price: 0, quarterly_price: 0, yearly_price: 0, max_students: 100, max_staff: 10, features: ['Student Profiles', 'Daily Attendance', 'Basic Fee Collection'], is_popular: false },
          { id: 2, name: 'Starter Tier', slug: 'starter', description: 'Ideal for growing schools up to 500 students', monthly_price: 2999, quarterly_price: 7999, yearly_price: 28790, max_students: 500, max_staff: 50, features: ['All Free Features', 'Online Fee Payment', 'WhatsApp Notifications', 'Period-Wise Attendance'], is_popular: false },
          { id: 3, name: 'Professional Tier', slug: 'professional', description: 'Most popular choice for schools up to 2,000 students', monthly_price: 5999, quarterly_price: 15999, yearly_price: 57590, max_students: 2000, max_staff: 150, features: ['All Starter Features', 'Biometric Gate API', 'Exam Report Cards', 'Hostel & Transport Module'], is_popular: true },
          { id: 4, name: 'Enterprise Tier', slug: 'enterprise', description: 'Unlimited scale for large educational institutions', monthly_price: 11999, quarterly_price: 31999, yearly_price: 115190, max_students: 10000, max_staff: 500, features: ['All Pro Features', 'Dedicated Database', '2FA Security Center', 'Custom Domain & 24/7 SLA'], is_popular: false },
        ]);
      });
  }, []);

  const getFeaturesList = (featuresInput: any): string[] => {
    if (Array.isArray(featuresInput)) return featuresInput;
    if (typeof featuresInput === 'string') {
      try {
        const parsed = JSON.parse(featuresInput);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return featuresInput.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return ['Student Profiles', 'Daily Attendance', 'Basic Fee Collection'];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <PublicNavbar />

      {/* Header */}
      <section className="py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">Transparent Pricing</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Flexible Plans Tailored to Your School's Student Strength</h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">No hidden setup fees. Switch or upgrade plans anytime as your student count grows.</p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl pt-2">
            <button onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Monthly Billing
            </button>
            <button onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              <span>Yearly Billing</span>
              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full uppercase">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans Cards Grid */}
      <section className="py-16 bg-slate-900 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map(p => {
            const price = billingCycle === 'yearly' ? Math.round((p.yearly_price || 0) / 12) : (p.monthly_price || 0);
            const featureList = getFeaturesList(p.features);

            return (
              <div key={p.id} className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all relative ${p.is_popular ? 'border-blue-500 bg-slate-950 shadow-2xl shadow-blue-500/20' : 'border-slate-800 bg-slate-950/70'}`}>
                {p.is_popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 fill-white" /> Most Popular Choice
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-900">
                    <div className="text-3xl font-black text-white">₹{price.toLocaleString()}<span className="text-xs text-slate-400 font-normal"> / month</span></div>
                    {billingCycle === 'yearly' && (p.yearly_price || 0) > 0 && (
                      <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">Billed annually ₹{(p.yearly_price || 0).toLocaleString()}/yr</div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs pt-2">
                    <div className="font-bold text-slate-300">Capacities:</div>
                    <div className="text-slate-400">• Up to <strong>{(p.max_students || 100).toLocaleString()} Students</strong></div>
                    <div className="text-slate-400">• Up to <strong>{p.max_staff || 10} Staff Members</strong></div>
                  </div>

                  <div className="space-y-2 text-xs pt-2 border-t border-slate-900">
                    <div className="font-bold text-slate-300">Included Features:</div>
                    {featureList.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Link to="/contact" className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${p.is_popular ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'}`}>
                    Choose {p.name} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
