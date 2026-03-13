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
    <div className="space-y-6 sm:space-y-8 text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Infra<span className="text-primary">structure</span>
          </h1>
          <p className="text-grey-500 font-medium text-sm sm:text-base">
            Live infrastructure metrics and 90-day uptime history
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-surface border border-border rounded-lg sm:rounded-xl font-bold text-primary hover:bg-white/5 transition-colors text-sm"
        >
          <RefreshCw size={16} className={`sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">REFRESH</span>
        </button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 border border-border">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-primary/10 text-primary rounded-xl sm:rounded-2xl"><Database size={18} className="sm:w-6 sm:h-6" /></div>
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">PostgreSQL</h3>
                <span className={`text-[10px] sm:text-xs font-bold ${metrics.database.status === 'up' ? 'text-success' : 'text-error'}`}>
                  {metrics.database.status === 'up' ? 'Operational' : 'Down'}
                </span>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-grey-500">Latency</span>
                <span className="font-bold">{metrics.database.latency >= 0 ? `${metrics.database.latency}ms` : 'ERR'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 border border-border">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-error/10 text-error rounded-xl sm:rounded-2xl"><Zap size={18} className="sm:w-6 sm:h-6" /></div>
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">Redis</h3>
                <span className={`text-[10px] sm:text-xs font-bold ${metrics.redis.status === 'up' ? 'text-success' : 'text-error'}`}>
                  {metrics.redis.status === 'up' ? 'Operational' : 'Down'}
                </span>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-grey-500">Latency</span>
                <span className="font-bold">{metrics.redis.latency >= 0 ? `${metrics.redis.latency}ms` : 'ERR'}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-grey-500">Memory</span>
                <span className="font-bold">{metrics.redis.memoryUsed}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 border border-border">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-warning/10 text-warning rounded-xl sm:rounded-2xl"><Cpu size={18} className="sm:w-6 sm:h-6" /></div>
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">Process</h3>
                <span className="text-[10px] sm:text-xs font-bold text-success">Running</span>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-grey-500">Uptime</span>
                <span className="font-bold">{formatUptime(metrics.process.uptimeSeconds)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-grey-500">Heap</span>
                <span className="font-bold">{metrics.process.memoryMB} MB</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 border border-border">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-success/10 text-success rounded-xl sm:rounded-2xl"><TrendingUp size={18} className="sm:w-6 sm:h-6" /></div>
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">Overall</h3>
                <span className="text-[10px] sm:text-xs font-bold text-success">90 Days</span>
              </div>
            </div>
            <div className="mt-1 sm:mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-success">{overallUptime}%</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* 90-Day Uptime Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-border"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground flex items-center gap-2">
            <HardDrive size={18} className="sm:w-6 sm:h-6" /> 90-Day Uptime History
          </h3>
          <span className="text-xs sm:text-sm font-bold text-success bg-success/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
            {overallUptime}% uptime
          </span>
        </div>
        <div className="flex gap-[1px] sm:gap-[2px] items-end h-12 sm:h-16">
          {uptimeHistory.map((day, i) => {
            const color = day.status === 'up' 
              ? 'bg-success/60 hover:bg-success' 
              : day.status === 'degraded' 
                ? 'bg-warning/60 hover:bg-warning' 
                : 'bg-error/60 hover:bg-error';
            return (
              <div key={i} className="flex-1 relative group cursor-pointer">
                <div className={`${color} rounded-[1px] sm:rounded-sm transition-all h-8 sm:h-10`} />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-surface border border-border px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl hidden sm:block">
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
          <div className="flex justify-between mt-2 sm:mt-3">
            <span className="text-[9px] sm:text-[10px] text-grey-500">{uptimeHistory[0]?.date}</span>
            <span className="text-[9px] sm:text-[10px] text-grey-500">Today</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm bg-success/60" />
            <span className="text-[10px] sm:text-xs text-grey-500">Operational</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm bg-warning/60" />
            <span className="text-[10px] sm:text-xs text-grey-500">Degraded</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm bg-error/60" />
            <span className="text-[10px] sm:text-xs text-grey-500">Outage</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
