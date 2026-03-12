'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Database, 
  Zap, 
  Cpu, 
  HardDrive,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';

interface InfraMetrics {
  database: { latency: number; status: string };
  redis: { latency: number; status: string; memoryUsed: string };
  process: { uptimeSeconds: number; memoryMB: number };
}

interface UptimeDay {
  date: string;
  status: 'up' | 'degraded' | 'down';
  uptimePercent: number;
}

export default function InfrastructurePage() {
  const [metrics, setMetrics] = useState<InfraMetrics | null>(null);
  const [uptimeHistory, setUptimeHistory] = useState<UptimeDay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [infraRes, uptimeRes] = await Promise.all([
        fetch('/api/backend/status/infra-metrics'),
        fetch('/api/backend/status/uptime-history'),
      ]);
      if (infraRes.ok) setMetrics(await infraRes.json());
      if (uptimeRes.ok) setUptimeHistory(await uptimeRes.json());
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const overallUptime = uptimeHistory.length > 0
    ? (uptimeHistory.filter(d => d.status === 'up').length / uptimeHistory.length * 100).toFixed(2)
    : '100.00';

  return (
    <div className="space-y-8 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Infra<span className="text-primary">structure</span>
          </h1>
          <p className="text-grey-500 font-medium">
            Live infrastructure metrics and 90-day uptime history
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl font-bold text-primary hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> REFRESH
        </button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-3xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl"><Database size={24} /></div>
              <div>
                <h3 className="font-bold text-foreground">PostgreSQL</h3>
                <span className={`text-xs font-bold ${metrics.database.status === 'up' ? 'text-success' : 'text-error'}`}>
                  {metrics.database.status === 'up' ? 'Operational' : 'Down'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Latency</span>
                <span className="font-bold">{metrics.database.latency >= 0 ? `${metrics.database.latency}ms` : 'ERR'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface rounded-3xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-error/10 text-error rounded-2xl"><Zap size={24} /></div>
              <div>
                <h3 className="font-bold text-foreground">Redis</h3>
                <span className={`text-xs font-bold ${metrics.redis.status === 'up' ? 'text-success' : 'text-error'}`}>
                  {metrics.redis.status === 'up' ? 'Operational' : 'Down'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Latency</span>
                <span className="font-bold">{metrics.redis.latency >= 0 ? `${metrics.redis.latency}ms` : 'ERR'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Memory</span>
                <span className="font-bold">{metrics.redis.memoryUsed}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface rounded-3xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-warning/10 text-warning rounded-2xl"><Cpu size={24} /></div>
              <div>
                <h3 className="font-bold text-foreground">Process</h3>
                <span className="text-xs font-bold text-success">Running</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Uptime</span>
                <span className="font-bold">{formatUptime(metrics.process.uptimeSeconds)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-500">Heap Memory</span>
                <span className="font-bold">{metrics.process.memoryMB} MB</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface rounded-3xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-success/10 text-success rounded-2xl"><TrendingUp size={24} /></div>
              <div>
                <h3 className="font-bold text-foreground">Overall Uptime</h3>
                <span className="text-xs font-bold text-success">90 Days</span>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-extrabold text-success">{overallUptime}%</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* 90-Day Uptime Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface rounded-3xl p-8 border border-border"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <HardDrive size={24} /> 90-Day Uptime History
          </h3>
          <span className="text-sm font-bold text-success bg-success/10 px-4 py-2 rounded-full">
            {overallUptime}% uptime
          </span>
        </div>
        <div className="flex gap-[2px] items-end h-16">
          {uptimeHistory.map((day, i) => {
            const color = day.status === 'up' 
              ? 'bg-success/60 hover:bg-success' 
              : day.status === 'degraded' 
                ? 'bg-warning/60 hover:bg-warning' 
                : 'bg-error/60 hover:bg-error';
            return (
              <div key={i} className="flex-1 relative group cursor-pointer">
                <div className={`${color} rounded-sm transition-all h-10`} />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-surface border border-border px-3 py-2 rounded-xl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                  <div className="text-foreground">{day.date}</div>
                  <div className={day.status === 'up' ? 'text-success' : day.status === 'degraded' ? 'text-warning' : 'text-error'}>
                    {day.uptimePercent}% — {day.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {uptimeHistory.length > 0 && (
          <div className="flex justify-between mt-3">
            <span className="text-[10px] text-grey-500">{uptimeHistory[0]?.date}</span>
            <span className="text-[10px] text-grey-500">Today</span>
          </div>
        )}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-success/60" />
            <span className="text-xs text-grey-500">Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-warning/60" />
            <span className="text-xs text-grey-500">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-error/60" />
            <span className="text-xs text-grey-500">Outage</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
