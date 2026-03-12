'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle } from 'lucide-react';

interface IncidentUpdate {
  time: string;
  msg: string;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  severity: 'Critical' | 'Major' | 'Minor' | string;
  date: string;
  time: string;
  updates: IncidentUpdate[];
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/backend/status/incidents');
        if (res.ok) {
          const data = await res.json();
          setIncidents(data);
        }
      } catch {
        // Fetch failed silently
      }
    };
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System <span className="text-secondary opacity-80">History</span></h1>
          <p className="text-grey-500 font-medium">Archival record of significant system events and resolutions</p>
        </div>
        <div className="p-3 bg-surface border border-border rounded-2xl flex items-center gap-2">
          <History size={20} className="text-primary" />
          <span className="text-sm font-bold text-grey-400">
            SYSTEM ARCHIVE: {incidents.length > 0 ? `${incidents.length} RECORDS` : 'LIVE TRACKING'} 
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {incidents.length === 0 && (
          <div className="bg-surface rounded-3xl border border-border shadow-sm p-12 text-center">
            <CheckCircle size={48} className="text-success/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground">No Incidents Recorded</h3>
            <p className="text-grey-500 font-medium mt-2 max-w-md mx-auto">
              All systems have been operating normally. Incidents will appear here automatically when detected.
            </p>
          </div>
        )}
        {incidents.map((incident, i) => (
          <motion.div 
            key={incident.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-border flex justify-between items-start bg-white/5">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground">{incident.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    incident.severity === 'Critical' ? 'bg-error/10 text-error' : 
                    incident.severity === 'Major' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                  }`}>
                    {incident.severity}
                  </span>
                </div>
                <p className="text-sm text-grey-500 font-medium mt-1">
                  {incident.date} • {incident.time}
                </p>
              </div>
              <div className="flex items-center gap-2 text-success font-bold text-sm bg-success/10 px-4 py-2 rounded-full border border-success/20">
                <CheckCircle size={16} /> {incident.status}
              </div>
            </div>
            
            <div className="p-6">
              <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                {incident.updates.map((update, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[37px] top-1 h-5 w-5 rounded-full bg-surface border-2 border-border flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-grey-500" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-grey-500 uppercase tracking-tighter">{update.time}</span>
                      <p className="text-sm text-foreground font-medium mt-1">{update.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
