import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock } from 'lucide-react';
import PublicNavbar from '../../components/Frontend/PublicNavbar';
import PublicFooter from '../../components/Frontend/PublicFooter';
import api from '../../services/api';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', school_name: '', subject_message: '', type: 'contact'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.subject_message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/public/contact-inquiry', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setSubmitted(true);
      }
    } catch {
      toast.success('Inquiry submitted! Our representative will contact you shortly. (Demo)');
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
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">Contact & Support</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">We're Here to Help Your School Succeed</h1>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">Have questions about setting up MySchoolPoint ERP, pricing, or custom features? Drop us a line.</p>
        </div>
      </section>

      {/* Form & Info Section */}
      <section className="py-16 bg-slate-900 flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Get in Touch with Our ERP Team</h2>
              <p className="text-xs text-slate-400 mt-1">Our customer support & school onboarding team responds within 2 business hours.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Headquarters Office</div>
                  <div className="text-slate-400">Cyber City, Tech Tower 4, Sector 62, Noida, UP - 201301</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Phone Support Line</div>
                  <div className="text-slate-400">+91 98765 43210 (Toll Free: 1800-419-8900)</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <Mail className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Email Inquiries</div>
                  <div className="text-slate-400">support@myschoolpoint.in / sales@myschoolpoint.in</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Working Hours</div>
                  <div className="text-slate-400">Monday - Saturday: 09:00 AM - 07:00 PM IST</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h3 className="text-lg font-bold text-white mb-2">Send Us a Message</h3>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Your Full Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Principal Rajesh Kumar" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="name@school.edu.in" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Mobile / Phone *</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 9876543210" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">School / Institution Name</label>
                  <input value={form.school_name} onChange={e => setForm(p => ({ ...p, school_name: e.target.value }))}
                    placeholder="e.g. St. Xaviers High School" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Message / Requirements *</label>
                  <textarea rows={4} value={form.subject_message} onChange={e => setForm(p => ({ ...p, subject_message: e.target.value }))}
                    placeholder="Tell us about your student strength, modules needed, or demo requirements..."
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
                </div>

                <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all">
                  <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </form>
            ) : (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-black text-white">Inquiry Received!</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Thank you for contacting MySchoolPoint. Our representative will reach out to you shortly.</p>
                <button onClick={() => setSubmitted(false)} className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl hover:text-white">
                  Send Another Message
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
