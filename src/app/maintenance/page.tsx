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
    <div className="space-y-6 sm:space-y-8 text-foreground">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Scheduled <span className="text-primary">Maintenance</span>
        </h1>
        <p className="text-grey-500 font-medium text-sm sm:text-base">
          Planned maintenance windows and service disruptions
        </p>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <Wrench size={18} className="sm:w-5 sm:h-5 text-primary" /> Upcoming & Active
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-surface rounded-2xl sm:rounded-3xl border border-border p-6 sm:p-12 text-center">
            <CheckCircle size={36} className="sm:w-12 sm:h-12 text-success/30 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-foreground">No Maintenance Scheduled</h3>
            <p className="text-grey-500 font-medium mt-2 text-sm">
              All systems are operating normally with no planned downtime.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {upcoming.map((w, i) => {
              const styles = getStatusStyles(w.status);
              const StatusIcon = styles.icon;
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">{w.title}</h3>
                      <p className="text-xs sm:text-sm text-grey-500 mt-1">{w.description}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 sm:gap-2 ${styles.bg} ${styles.text} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold w-fit`}>
                      <StatusIcon size={12} className="sm:w-3.5 sm:h-3.5" /> {w.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm text-grey-500">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CalendarDays size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>{new Date(w.scheduledStart).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>
                        {new Date(w.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {new Date(w.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {w.affectedServices && (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Server size={12} className="sm:w-3.5 sm:h-3.5" />
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
          <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="sm:w-5 sm:h-5 text-success" /> Past Maintenance
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {past.map((w, i) => {
              const styles = getStatusStyles(w.status);
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 opacity-60"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                    <div>
                      <h3 className="font-bold text-foreground text-sm sm:text-base">{w.title}</h3>
                      <p className="text-[10px] sm:text-xs text-grey-500 mt-1">
                        {new Date(w.scheduledStart).toLocaleDateString()} — {w.status}
                      </p>
                    </div>
                    <span className={`${styles.bg} ${styles.text} px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold w-fit`}>
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
