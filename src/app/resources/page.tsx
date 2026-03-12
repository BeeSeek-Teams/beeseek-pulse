'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick, HardDrive, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ResourcePoint {
  ts: number;
  cpuPercent: number;
  rssMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function MiniAreaChart({
  data,
  valueKey,
  color,
  maxVal,
  unit,
  height = 180,
}: {
  data: ResourcePoint[];
  valueKey: keyof ResourcePoint;
  color: string;
  maxVal?: number;
  unit: string;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-grey-500 text-sm" style={{ height }}>
        Collecting data...
      </div>
    );
  }

  const values = data.map((d) => d[valueKey] as number);
  const max = maxVal ?? (Math.max(...values) * 1.2 || 1);
  const w = 100;
  const h = 100;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  });

  const areaPoints = [`0,${h}`, ...points, `${w},${h}`].join(' ');
  const linePoints = points.join(' ');

  // Y-axis labels
  const yLabels = [0, max * 0.25, max * 0.5, max * 0.75, max].reverse();

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-[10px] text-grey-500 py-1">
        {yLabels.map((v, i) => (
          <span key={i}>{v >= 100 ? Math.round(v) : v.toFixed(1)}</span>
        ))}
      </div>
      <div className="ml-11 h-full">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1="0" y1={h * p} x2={w} y2={h * p}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.3"
            />
          ))}
          <polygon points={areaPoints} fill={`url(#grad-${valueKey})`} />
          <polyline points={linePoints} fill="none" stroke={color} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      {/* X-axis time labels */}
      <div className="ml-11 flex justify-between text-[10px] text-grey-500 mt-1">
        <span>{formatTime(data[0].ts)}</span>
        <span>{formatTime(data[Math.floor(data.length / 2)].ts)}</span>
        <span>{formatTime(data[data.length - 1].ts)}</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-warning' : trend === 'down' ? 'text-success' : 'text-grey-500';
  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <span className="text-xs font-bold text-grey-500 uppercase tracking-wider">{label}</span>
        </div>
        {trend && <TrendIcon size={14} className={trendColor} />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span className="text-xs text-grey-500">{unit}</span>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [data, setData] = useState<ResourcePoint[]>([]);
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/backend/status/resource-history?hours=${hours}&points=96`);
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [hours]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const latest = data.length > 0 ? data[data.length - 1] : null;
  const prev = data.length > 1 ? data[data.length - 2] : null;

  const cpuTrend = latest && prev
    ? latest.cpuPercent > prev.cpuPercent + 1 ? 'up' as const : latest.cpuPercent < prev.cpuPercent - 1 ? 'down' as const : 'flat' as const
    : undefined;
  const memTrend = latest && prev
    ? latest.rssMB > prev.rssMB + 5 ? 'up' as const : latest.rssMB < prev.rssMB - 5 ? 'down' as const : 'flat' as const
    : undefined;

  // Detect spikes
  const avgCpu = data.length > 0 ? data.reduce((s, d) => s + d.cpuPercent, 0) / data.length : 0;
  const maxCpu = data.length > 0 ? Math.max(...data.map(d => d.cpuPercent)) : 0;
  const avgRss = data.length > 0 ? data.reduce((s, d) => s + d.rssMB, 0) / data.length : 0;
  const maxRss = data.length > 0 ? Math.max(...data.map(d => d.rssMB)) : 0;
  const cpuSpike = maxCpu > avgCpu * 2 && maxCpu > 10;
  const memSpike = maxRss > avgRss * 1.5 && maxRss > avgRss + 50;

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Resource <span className="text-primary">Monitor</span>
          </h1>
          <p className="text-grey-500 text-sm mt-1">
            CPU, memory &amp; heap usage — live from the backend process
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range picker */}
          <div className="flex bg-surface rounded-xl border border-border overflow-hidden">
            {[1, 6, 24].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  hours === h
                    ? 'bg-primary text-background'
                    : 'text-grey-500 hover:text-foreground'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-surface border border-border text-grey-500 hover:text-primary transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Spike alerts */}
      {(cpuSpike || memSpike) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-center gap-3"
        >
          <TrendingUp size={20} className="text-warning shrink-0" />
          <div className="text-sm">
            {cpuSpike && <span className="text-warning font-bold">CPU spike detected — </span>}
            {cpuSpike && <span className="text-grey-500">peak {maxCpu.toFixed(1)}% vs avg {avgCpu.toFixed(1)}%. </span>}
            {memSpike && <span className="text-warning font-bold">Memory spike detected — </span>}
            {memSpike && <span className="text-grey-500">peak {maxRss.toFixed(0)}MB vs avg {avgRss.toFixed(0)}MB</span>}
          </div>
        </motion.div>
      )}

      {/* Live stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="CPU Usage"
          value={latest ? latest.cpuPercent.toFixed(1) : '—'}
          unit="%"
          icon={Cpu}
          color="text-primary"
          trend={cpuTrend}
        />
        <StatCard
          label="RSS Memory"
          value={latest ? latest.rssMB.toFixed(0) : '—'}
          unit="MB"
          icon={MemoryStick}
          color="text-info"
          trend={memTrend}
        />
        <StatCard
          label="Heap Used"
          value={latest ? latest.heapUsedMB.toFixed(0) : '—'}
          unit="MB"
          icon={HardDrive}
          color="text-warning"
        />
        <StatCard
          label="External"
          value={latest ? latest.externalMB.toFixed(1) : '—'}
          unit="MB"
          icon={HardDrive}
          color="text-success"
        />
      </div>

      {/* CPU Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">CPU Usage</h2>
          </div>
          <span className="text-xs text-grey-500">Last {hours}h • % utilization</span>
        </div>
        <MiniAreaChart
          data={data}
          valueKey="cpuPercent"
          color="#FFD60A"
          maxVal={100}
          unit="%"
          height={200}
        />
      </motion.div>

      {/* Memory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-3xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MemoryStick size={18} className="text-info" />
              <h2 className="font-bold text-foreground">RSS Memory</h2>
            </div>
            <span className="text-xs text-grey-500">Total process memory</span>
          </div>
          <MiniAreaChart
            data={data}
            valueKey="rssMB"
            color="#007AFF"
            unit="MB"
            height={180}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-3xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive size={18} className="text-warning" />
              <h2 className="font-bold text-foreground">Heap Usage</h2>
            </div>
            <span className="text-xs text-grey-500">V8 heap used vs total</span>
          </div>
          <MiniAreaChart
            data={data}
            valueKey="heapUsedMB"
            color="#FF9F0A"
            unit="MB"
            height={180}
          />
        </motion.div>
      </div>

      {/* Summary table */}
      {data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-3xl border border-border p-6"
        >
          <h2 className="font-bold text-foreground mb-4">Period Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-grey-500 text-xs uppercase tracking-wider border-b border-border">
                  <th className="text-left py-2 pr-4">Metric</th>
                  <th className="text-right py-2 px-4">Current</th>
                  <th className="text-right py-2 px-4">Average</th>
                  <th className="text-right py-2 px-4">Peak</th>
                  <th className="text-right py-2 pl-4">Min</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {[
                  { label: 'CPU %', key: 'cpuPercent' as keyof ResourcePoint, unit: '%', decimals: 1 },
                  { label: 'RSS Memory', key: 'rssMB' as keyof ResourcePoint, unit: 'MB', decimals: 0 },
                  { label: 'Heap Used', key: 'heapUsedMB' as keyof ResourcePoint, unit: 'MB', decimals: 0 },
                  { label: 'Heap Total', key: 'heapTotalMB' as keyof ResourcePoint, unit: 'MB', decimals: 0 },
                  { label: 'External', key: 'externalMB' as keyof ResourcePoint, unit: 'MB', decimals: 1 },
                ].map((row) => {
                  const vals = data.map((d) => d[row.key] as number);
                  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                  const max = Math.max(...vals);
                  const min = Math.min(...vals);
                  const current = vals[vals.length - 1];
                  return (
                    <tr key={row.label} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">{row.label}</td>
                      <td className="text-right py-2 px-4 font-mono">{current.toFixed(row.decimals)} {row.unit}</td>
                      <td className="text-right py-2 px-4 font-mono text-grey-500">{avg.toFixed(row.decimals)} {row.unit}</td>
                      <td className="text-right py-2 px-4 font-mono text-warning">{max.toFixed(row.decimals)} {row.unit}</td>
                      <td className="text-right py-2 pl-4 font-mono text-success">{min.toFixed(row.decimals)} {row.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {lastRefresh && (
            <p className="text-xs text-grey-500 mt-3">
              Last refreshed: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 15s
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
