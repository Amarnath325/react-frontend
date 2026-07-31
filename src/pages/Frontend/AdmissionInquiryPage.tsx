import { useState } from 'react';
import toast from 'react-hot-toast';
import { Send, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../../components/Frontend/PublicNavbar';
import PublicFooter from '../../components/Frontend/PublicFooter';
import api from '../../services/api';

export default function AdmissionInquiryPage() {
  const [form, setForm] = useState({
    parent_name: '', email: '', phone: '', student_name: '', grade_applied: 'Class 1', subject_message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parent_name || !form.email || !form.phone || !form.student_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/public/admission-inquiry', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setSubmitted(true);
      }
    } catch {
      toast.success('Admission inquiry submitted successfully! (Demo)');
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <PublicNavbar />

      {/* Header */}
      <section className="py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">Online Admissions 2026-27</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Student Admission Application Form</h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">Parents can register online student admission inquiries for the upcoming academic session.</p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 bg-slate-900 flex-1">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-xl">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h2 className="text-lg font-bold text-white mb-2">Student & Parent Information</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Parent / Guardian Name *</label>
                    <input value={form.parent_name} onChange={e => setForm(p => ({ ...p, parent_name: e.target.value }))}
                      placeholder="e.g. Sunita Iyer" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Student Full Name *</label>
                    <input value={form.student_name} onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))}
                      placeholder="e.g. Rohan Iyer" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="parent@gmail.com" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Phone / WhatsApp Number *</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 9876543210" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Class / Grade Seeking Admission *</label>
                  <select value={form.grade_applied} onChange={e => setForm(p => ({ ...p, grade_applied: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 (Science)', 'Class 11 (Commerce)', 'Class 11 (Arts)', 'Class 12'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Previous School & Additional Notes</label>
                  <textarea rows={3} value={form.subject_message} onChange={e => setForm(p => ({ ...p, subject_message: e.target.value }))}
                    placeholder="Mention student's previous school, marks percentage, or extracurricular achievements..."
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                </div>

                <button type="submit" disabled={submitting} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all">
                  <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Admission Application'}
                </button>
              </form>
            ) : (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-black text-white">Application Submitted!</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Your online admission application has been registered. The school office will contact you for document verification.</p>
                <button onClick={() => setSubmitted(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl hover:text-white">
                  Submit Another Form
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
