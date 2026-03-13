'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  CloudCog,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Gauge,
  Clock,
  Zap,
} from 'lucide-react';

interface LatencyPoint {
  ts: number;
  overall: number;
  db: number;
  redis: number;
}

interface Percentiles {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  samples: number;
}

export default function DashboardPage() {
  const [systemStatus, setSystemStatus] = useState<'up' | 'down' | 'loading'>('loading');
  const [latency, setLatency] = useState('...');
  const [summary, setSummary] = useState({
    uptime: '—',
    avgLatency: '—',
    securityStatus: '—',
  });
  const [percentiles, setPercentiles] = useState<Percentiles | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<LatencyPoint[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [chartMode, setChartMode] = useState<'overall' | 'db' | 'redis'>('overall');

  const checkHealth = useCallback(async () => {
    try {
      const start = Date.now();
      const res = await fetch('/api/backend/health');
      if (res.ok) {
        setSystemStatus('up');
        setLatency(`${Date.now() - start}ms`);
      } else {
        setSystemStatus('down');
      }

      const [summaryRes, latencyRes, eventsRes] = await Promise.all([
        fetch('/api/backend/status/summary'),
        fetch('/api/backend/status/latency-history?points=48'),
        fetch('/api/backend/status/events'),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary({
          uptime: summaryData.uptime || '—',
          avgLatency: summaryData.avgLatency || '—',
          securityStatus: summaryData.securityStatus || '—',
        });
        if (summaryData.percentiles) setPercentiles(summaryData.percentiles);
      }

      if (latencyRes.ok) {
        const history = await latencyRes.json();
        if (Array.isArray(history)) setLatencyHistory(history);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (Array.isArray(eventsData)) setRecentEvents(eventsData);
      }
    } catch {
      setSystemStatus('down');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const getChartValue = (point: LatencyPoint) => {
    if (chartMode === 'db') return point.db;
    if (chartMode === 'redis') return point.redis;
    return point.overall;
  };

  const maxLatency = latencyHistory.length > 0
    ? Math.max(...latencyHistory.map(getChartValue).filter(v => v >= 0), 1)
    : 1;

  const stats = [
    { label: 'System Uptime', value: summary.uptime, change: systemStatus === 'up' ? 'Stable' : 'N/A', icon: CloudCog, color: 'bg-success' },
    { label: 'Response Time', value: systemStatus === 'up' ? latency : '—', change: systemStatus === 'up' ? 'Live' : 'N/A', icon: Activity, color: 'bg-primary' },
    { label: 'Security Status', value: summary.securityStatus, change: 'Stable', icon: ShieldCheck, color: 'bg-secondary' },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight"
          >
            System <span className="text-primary italic"> Pulse</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-grey-500 font-medium text-sm sm:text-base md:text-lg mt-1"
          >
            Global infrastructure health and performance metrics
          </motion.p>
        </div>
        {systemStatus === 'up' ? (
          <div className="flex items-center gap-2 bg-success/10 text-success px-3 sm:px-4 py-2 rounded-full font-bold animate-pulse text-xs sm:text-sm whitespace-nowrap">
            <CheckCircle size={16} className="shrink-0" />
            <span className="hidden xs:inline">All Systems </span>Operational
          </div>
        ) : systemStatus === 'loading' ? (
          <div className="flex items-center gap-2 bg-grey-100 text-grey-500 px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm">
            Checking...
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-error/10 text-error px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap">
            <AlertTriangle size={16} className="shrink-0" />
            Issues Detected
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-3xl bg-surface p-6 shadow-sm border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-2xl text-background`}>
                  <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold ${stat.change === 'Stable' || stat.change === 'Live' ? 'text-success' : 'text-error'}`}>
                  {stat.change}
                </div>
              </div>
              <h3 className="text-grey-500 text-sm font-bold uppercase tracking-wider">{stat.label}</h3>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {percentiles && percentiles.samples > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          {[
            { label: 'P50', value: `${percentiles.p50}ms`, icon: Gauge },
            { label: 'P95', value: `${percentiles.p95}ms`, icon: TrendingUp },
            { label: 'P99', value: `${percentiles.p99}ms`, icon: TrendingUp },
            { label: 'Average', value: `${percentiles.avg}ms`, icon: Clock },
            { label: 'Min', value: `${percentiles.min}ms`, icon: Zap },
            { label: 'Max', value: `${percentiles.max}ms`, icon: AlertTriangle },
          ].map((p) => (
            <div key={p.label} className="bg-surface rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <p.icon size={12} className="text-primary sm:w-[14px] sm:h-[14px]" />
                <span className="text-[10px] sm:text-xs font-bold text-grey-500 uppercase tracking-wider">{p.label}</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-foreground">{p.value}</p>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-3 lg:col-span-full text-right">
            <span className="text-[10px] sm:text-xs text-grey-500">{percentiles.samples} samples in last 24h</span>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl sm:rounded-3xl bg-surface p-4 sm:p-6 md:p-8 shadow-sm border border-border h-[280px] sm:h-[350px] md:h-[400px] flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 size={20} className="sm:w-6 sm:h-6" /> Network Latency (24h)
            </h3>
            <div className="flex gap-1 bg-background rounded-lg sm:rounded-xl p-1">
              {(['overall', 'db', 'redis'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={`px-2 sm:px-3 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-colors ${
                    chartMode === mode 
                      ? 'bg-primary text-background' 
                      : 'text-grey-500 hover:text-foreground'
                  }`}
                >
                  {mode === 'overall' ? 'Overall' : mode === 'db' ? 'Database' : 'Redis'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-end gap-[3px] px-2 pb-4 relative">
            {latencyHistory.length > 0 ? latencyHistory.map((point, i) => {
              const val = getChartValue(point);
              const heightPct = val >= 0 ? (val / maxLatency) * 100 : 0;
              const barColor = val < 0
                ? 'bg-error/40'
                : val < 50
                  ? 'bg-success/60 hover:bg-success'
                  : val < 150
                    ? 'bg-primary/60 hover:bg-primary'
                    : val < 500
                      ? 'bg-warning/60 hover:bg-warning'
                      : 'bg-error/60 hover:bg-error';
              return (
                <div 
                  key={i} 
                  className={`flex-1 ${barColor} transition-all rounded-t-lg relative group cursor-pointer`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                >
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-surface border border-border px-3 py-2 rounded-xl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                    <div className="text-foreground">{val >= 0 ? `${val}ms` : 'ERR'}</div>
                    <div className="text-grey-500">{new Date(point.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-grey-500">
                <Activity size={32} className="mb-3 animate-pulse text-primary/30" />
                <p className="font-bold text-sm">Collecting latency data...</p>
                <p className="text-xs mt-1">First data appears within 30 seconds</p>
              </div>
            )}
          </div>
          {latencyHistory.length > 0 && (
            <div className="flex justify-between px-2 mt-2">
              <span className="text-[10px] text-grey-500">
                {new Date(latencyHistory[0]?.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] text-grey-500">
                {new Date(latencyHistory[latencyHistory.length - 1]?.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl sm:rounded-3xl bg-surface p-4 sm:p-6 md:p-8 shadow-sm border border-border"
        >
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-4 sm:mb-6">Recent Status Changes</h3>
          <div className="space-y-4 sm:space-y-6">
            {recentEvents.length > 0 ? recentEvents.map((event, i) => (
              <div key={i} className="flex gap-4">
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${event.type === 'warning' ? 'bg-warning' : event.type === 'success' ? 'bg-success' : 'bg-primary'}`} />
                <div>
                  <p className="text-sm font-bold text-foreground">{event.title}</p>
                  <p className="text-xs text-grey-500 font-medium">{event.msg}</p>
                  <p className="text-[10px] text-grey-500 mt-1">{event.time}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle size={32} className="text-success/40 mb-3" />
                <p className="text-sm font-bold text-grey-500">All Clear</p>
                <p className="text-xs text-grey-500 mt-1">No recent status changes</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
