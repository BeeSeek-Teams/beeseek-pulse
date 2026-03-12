'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  CalendarDays,
  Server,
} from 'lucide-react';

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  scheduledStart: string;
  scheduledEnd: string;
  affectedServices: string | null;
}

export default function MaintenancePage() {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const res = await fetch('/api/backend/status/maintenance');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setWindows(data);
        }
      } catch { /* silent */ }
    };
    fetchMaintenance();
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Scheduled': return { bg: 'bg-primary/10', text: 'text-primary', icon: Clock };
      case 'In Progress': return { bg: 'bg-warning/10', text: 'text-warning', icon: AlertTriangle };
      case 'Completed': return { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle };
      case 'Cancelled': return { bg: 'bg-grey-100', text: 'text-grey-500', icon: CheckCircle };
      default: return { bg: 'bg-grey-100', text: 'text-grey-500', icon: Clock };
    }
  };

  const upcoming = windows.filter(w => w.status === 'Scheduled' || w.status === 'In Progress');
  const past = windows.filter(w => w.status === 'Completed' || w.status === 'Cancelled');

  return (
    <div className="space-y-8 text-foreground">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Scheduled <span className="text-primary">Maintenance</span>
        </h1>
        <p className="text-grey-500 font-medium">
          Planned maintenance windows and service disruptions
        </p>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Wrench size={20} className="text-primary" /> Upcoming & Active
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-border p-12 text-center">
            <CheckCircle size={48} className="text-success/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground">No Maintenance Scheduled</h3>
            <p className="text-grey-500 font-medium mt-2">
              All systems are operating normally with no planned downtime.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((w, i) => {
              const styles = getStatusStyles(w.status);
              const StatusIcon = styles.icon;
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface rounded-3xl border border-border p-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{w.title}</h3>
                      <p className="text-sm text-grey-500 mt-1">{w.description}</p>
                    </div>
                    <span className={`flex items-center gap-2 ${styles.bg} ${styles.text} px-4 py-2 rounded-full text-xs font-bold`}>
                      <StatusIcon size={14} /> {w.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-grey-500">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} />
                      <span>{new Date(w.scheduledStart).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        {new Date(w.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {new Date(w.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {w.affectedServices && (
                      <div className="flex items-center gap-2">
                        <Server size={14} />
                        <span>{w.affectedServices}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-success" /> Past Maintenance
          </h2>
          <div className="space-y-4">
            {past.map((w, i) => {
              const styles = getStatusStyles(w.status);
              const StatusIcon = styles.icon;
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface rounded-2xl border border-border p-5 opacity-60"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-foreground">{w.title}</h3>
                      <p className="text-xs text-grey-500 mt-1">
                        {new Date(w.scheduledStart).toLocaleDateString()} — {w.status}
                      </p>
                    </div>
                    <span className={`${styles.bg} ${styles.text} px-3 py-1 rounded-full text-xs font-bold`}>
                      {w.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
