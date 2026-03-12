'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, CheckCircle, CheckCircle2, Mail, ShieldCheck, Wrench } from 'lucide-react';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/backend/status/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to connect to server');
    }
  };

  return (
    <div className="space-y-8 text-foreground max-w-2xl mx-auto">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex p-4 bg-primary/10 rounded-3xl mb-6"
        >
          <Bell size={40} className="text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Status <span className="text-primary">Notifications</span>
        </h1>
        <p className="text-grey-500 font-medium mt-2">
          Get notified when BeeSeek experiences incidents or scheduled maintenance
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl border border-border p-8"
      >
        <form onSubmit={handleSubscribe} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-grey-500 uppercase tracking-wider mb-2 block">
              Email Address
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-grey-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-background border border-border rounded-xl px-12 py-4 text-foreground placeholder:text-grey-500/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-primary text-background font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe to Updates'}
          </button>
        </form>

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3"
          >
            <CheckCircle size={20} className="text-success shrink-0" />
            <p className="text-sm font-medium text-success">{message}</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3"
          >
            <ShieldCheck size={20} className="text-error shrink-0" />
            <p className="text-sm font-medium text-error">{message}</p>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Incident Alerts', desc: 'Get immediate notifications when services go down', Icon: AlertTriangle, color: 'text-error' },
          { title: 'Maintenance Notices', desc: 'Know about planned downtime in advance', Icon: Wrench, color: 'text-warning' },
          { title: 'Resolution Updates', desc: 'Stay informed as issues are investigated and resolved', Icon: CheckCircle2, color: 'text-success' },
        ].map((item) => (
          <div key={item.title} className="bg-surface rounded-2xl border border-border p-5 text-center">
            <div className="flex justify-center mb-3">
              <item.Icon size={24} className={item.color} />
            </div>
            <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
            <p className="text-xs text-grey-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
