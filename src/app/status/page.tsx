'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Globe,
  Database,
  Zap,
  ShieldCheck
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'loading';
  uptime: string;
  latency: string;
  icon: any;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Core API Cluster', status: 'loading', uptime: '—', latency: '...', icon: Globe },
    { name: 'PostgreSQL Engine', status: 'loading', uptime: '—', latency: '...', icon: Database },
    { name: 'Redis Memory Cache', status: 'loading', uptime: '—', latency: '...', icon: Zap },
    { name: 'Cloudinary CDN', status: 'loading', uptime: '—', latency: '...', icon: Globe },
    { name: 'Disk Infrastructure', status: 'loading', uptime: '—', latency: '...', icon: Database },
  ]);

  const [incidents, setIncidents] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshStatus = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/backend/health');
      const data = await response.json();
      const latency = `${Date.now() - startTime}ms`;

      setServices(prev => prev.map(s => {
        if (s.name === 'Core API Cluster') {
          return { ...s, status: data.status === 'ok' ? 'healthy' : 'down', latency };
        }
        if (s.name === 'PostgreSQL Engine') {
          const dbStatus = data.info?.database?.status;
          return { ...s, status: dbStatus === 'up' ? 'healthy' : 'down', latency: dbStatus === 'up' ? '< 5ms' : 'ERR' };
        }
        if (s.name === 'Redis Memory Cache') {
          const redisStatus = data.info?.redis?.status;
          return { ...s, status: redisStatus === 'up' ? 'healthy' : 'down', latency: redisStatus === 'up' ? '< 2ms' : 'ERR' };
        }
        if (s.name === 'Cloudinary CDN') {
          const cloudStatus = data.info?.cloudinary?.status;
          return { ...s, status: cloudStatus === 'up' ? 'healthy' : 'down', latency: cloudStatus === 'up' ? '~150ms' : 'ERR' };
        }
        if (s.name === 'Disk Infrastructure') {
          const storageStatus = data.info?.storage?.status;
          return { ...s, status: storageStatus === 'up' ? 'healthy' : 'down', latency: storageStatus === 'up' ? '< 1ms' : 'ERR' };
        }
        return s;
      }));
    } catch {
      setServices(prev => prev.map(s => ({ ...s, status: 'down', latency: 'ERR' })));
    }
    setLastUpdated(new Date());
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/backend/status/incidents');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setIncidents(data.slice(0, 3));
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    refreshStatus();
    fetchIncidents();
    const interval = setInterval(() => {
      refreshStatus();
      fetchIncidents();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System <span className="text-primary">Nodes</span></h1>
          <p className="text-grey-500 font-medium italic">Active telemetry from global infrastructure clusters</p>
        </div>
        <button 
          onClick={refreshStatus}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl font-bold text-primary hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={20} /> SYNC
        </button>
      </div>

      <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-white/5 flex justify-between items-center">
          <span className="text-sm font-bold text-grey-500 uppercase tracking-wider">Service</span>
          <div className="flex gap-12">
            <span className="text-sm font-bold text-grey-500 uppercase tracking-wider w-24">Status</span>
            <span className="text-sm font-bold text-grey-500 uppercase tracking-wider w-20">Uptime</span>
            <span className="text-sm font-bold text-grey-500 uppercase tracking-wider w-20">Latency</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {services.map((service, index) => (
            <motion.div 
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <service.icon size={24} />
                </div>
                <span className="font-bold text-foreground text-lg">{service.name}</span>
              </div>
              
              <div className="flex gap-12 items-center">
                <div className="w-24">
                  {service.status === 'healthy' && (
                    <span className="flex items-center gap-2 text-success font-bold text-sm">
                      <CheckCircle size={16} /> Operational
                    </span>
                  )}
                  {service.status === 'degraded' && (
                    <span className="flex items-center gap-2 text-warning font-bold text-sm">
                      <AlertTriangle size={16} /> Degraded
                    </span>
                  )}
                  {service.status === 'down' && (
                    <span className="flex items-center gap-2 text-error font-bold text-sm">
                      <XCircle size={16} /> Outage
                    </span>
                  )}
                  {service.status === 'loading' && (
                    <span className="flex items-center gap-2 text-grey-500 font-bold text-sm">
                      <RefreshCw className="animate-spin" size={16} /> Loading
                    </span>
                  )}
                </div>
                <span className="w-20 font-mono text-sm text-grey-500">{service.uptime}</span>
                <span className="w-20 font-mono text-sm text-grey-500">{service.latency}</span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="p-4 bg-white/5 text-center border-t border-border">
          <p className="text-xs text-grey-500 font-medium">
            Last updated: {lastUpdated.toLocaleTimeString()} — System time: {lastUpdated.toUTCString()}
          </p>
        </div>
      </div>

      {/* Incident History Section */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-foreground mb-6">Incident History</h2>
        <div className="space-y-4">
          {incidents.length > 0 ? incidents.map((incident, i) => (
            <div key={i} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-grey-500 uppercase tracking-widest">{incident.date}</p>
                <h3 className="text-lg font-bold text-foreground mt-1">{incident.title}</h3>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${incident.status === 'Resolved' || incident.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {incident.status}
                </span>
                <p className="text-xs text-grey-500 mt-2">{incident.severity} Severity</p>
              </div>
            </div>
          )) : (
            <div className="bg-surface p-8 rounded-2xl border border-border text-center text-grey-500 italic">
              No recent incidents reported.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
