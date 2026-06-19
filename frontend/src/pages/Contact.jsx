import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! We will contact you soon.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="section-title">Contact <span className="gradient-text">Us</span></h1>
          <p className="text-gray-500">Get in touch with DHA Housing administration</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {[
              { icon: Phone, label: 'Phone', value: '+92 300 1234567' },
              { icon: Mail, label: 'Email', value: 'info@dha-housing.com' },
              { icon: MapPin, label: 'Address', value: 'DHA Phase 1, Main Boulevard, Karachi' },
            ].map((item) => (
              <div key={item.label} className="glass-card p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-royal/10 flex items-center justify-center">
                  <item.icon className="text-royal" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <p className="font-medium text-navy">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="lg:col-span-2 glass-card p-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Name</label>
                <input type="text" required className="input-field" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Email</label>
                <input type="email" required className="input-field" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Subject</label>
              <input type="text" required className="input-field" value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Message</label>
              <textarea required rows={5} className="input-field resize-none" value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Send size={18} /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
