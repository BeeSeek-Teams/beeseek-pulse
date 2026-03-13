'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  ArrowDown,
  Pause,
  Play,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  MessageSquare,
  ChevronDown,
  X,
} from 'lucide-react';

interface LogEntry {
  ts: string;
  level: string;
  context: string;
  message: string;
  meta?: Record<string, any>;
}

const LEVEL_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  error:   { color: 'text-error',   bg: 'bg-error/10 border-error/20',   icon: AlertCircle },
  warn:    { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: AlertTriangle },
  log:     { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: Info },
  debug:   { color: 'text-grey-500', bg: 'bg-grey-50 border-grey-100',     icon: Bug },
  verbose: { color: 'text-grey-500', bg: 'bg-grey-50 border-grey-100',     icon: MessageSquare },
};

function getLevelConfig(level: string) {
  return LEVEL_CONFIG[level.toLowerCase()] || LEVEL_CONFIG['log'];
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [contextFilter, setContextFilter] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [uniqueContexts, setUniqueContexts] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('count', '300');
      if (levelFilter) params.set('level', levelFilter);
      if (contextFilter) params.set('context', contextFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/backend/status/logs?${params}`);
      if (res.ok) {
        const data: LogEntry[] = await res.json();
        setLogs(data);

        // Extract unique contexts
        const contexts = [...new Set(data.map((l) => l.context))].sort();
        setUniqueContexts(contexts);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [levelFilter, contextFilter, searchQuery]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchLogs, autoRefresh]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClear = async () => {
    try {
      await fetch('/api/backend/status/logs', { method: 'DELETE' });
      setLogs([]);
    } catch {
      // ignore
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + '.' + d.getMilliseconds().toString().padStart(3, '0');
    } catch {
      return ts;
    }
  };

  const levelCounts = logs.reduce(
    (acc, l) => {
      const k = l.level.toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <ScrollText className="text-primary" size={28} />
            Live Application Logs
          </h1>
          <p className="text-grey-500 text-sm mt-1">
            Real-time log stream from the production backend — {logs.length} entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
              autoRefresh
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-grey-50 text-grey-500 border-grey-100'
            }`}
          >
            {autoRefresh ? <Play size={14} /> : <Pause size={14} />}
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-grey-500 hover:text-foreground text-xs font-medium transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium transition-colors hover:bg-error/20"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['error', 'warn', 'log', 'debug', 'verbose'].map((level) => {
          const config = getLevelConfig(level);
          const count = levelCounts[level] || 0;
          const isActive = levelFilter === level;
          return (
            <button
              key={level}
              onClick={() => setLevelFilter(isActive ? '' : level)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                isActive
                  ? config.bg + ' ring-1 ring-current'
                  : 'bg-surface border-border hover:border-grey-100'
              }`}
            >
              <span className={`text-xs font-medium uppercase ${isActive ? config.color : 'text-grey-500'}`}>
                {level}
              </span>
              <span className={`text-lg font-bold ${isActive ? config.color : 'text-foreground'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm placeholder:text-grey-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-500 hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-grey-500 hover:text-foreground text-sm transition-colors"
          >
            <Filter size={16} />
            Context
            {contextFilter && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                {contextFilter}
              </span>
            )}
            <ChevronDown size={14} />
          </button>

          <AnimatePresence>
            {showFilterPanel && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <span className="text-xs font-medium text-grey-500">Filter by context</span>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                  <button
                    onClick={() => { setContextFilter(''); setShowFilterPanel(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !contextFilter ? 'bg-primary/10 text-primary' : 'text-grey-500 hover:bg-grey-50'
                    }`}
                  >
                    All Contexts
                  </button>
                  {uniqueContexts.map((ctx) => (
                    <button
                      key={ctx}
                      onClick={() => { setContextFilter(ctx); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                        contextFilter === ctx ? 'bg-primary/10 text-primary' : 'text-grey-500 hover:bg-grey-50'
                      }`}
                    >
                      {ctx}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors border ${
            autoScroll
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-surface text-grey-500 border-border'
          }`}
        >
          <ArrowDown size={16} />
          Auto-scroll
        </button>
      </div>

      {/* Log Stream */}
      <div
        ref={scrollRef}
        className="bg-surface border border-border rounded-2xl overflow-hidden"
        style={{ height: 'calc(100vh - 380px)', minHeight: '400px' }}
      >
        <div className="overflow-y-auto h-full font-mono text-xs" ref={scrollRef}>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-grey-500">
              <RefreshCw size={20} className="animate-spin mr-3" />
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-grey-500 gap-3">
              <ScrollText size={40} className="opacity-30" />
              <p>No logs matching filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {[...logs].reverse().map((log, idx) => {
                const config = getLevelConfig(log.level);
                const Icon = config.icon;
                const isExpanded = expandedLog === idx;

                return (
                  <motion.div
                    key={`${log.ts}-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`px-4 py-2 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                      log.level === 'error' ? 'bg-error/[0.03]' : ''
                    }`}
                    onClick={() => setExpandedLog(isExpanded ? null : idx)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Timestamp */}
                      <span className="text-grey-500 shrink-0 pt-0.5 tabular-nums w-[95px]">
                        {formatTime(log.ts)}
                      </span>

                      {/* Level badge */}
                      <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${config.bg} ${config.color}`}>
                        <Icon size={10} />
                        {log.level.padEnd(5)}
                      </span>

                      {/* Context */}
                      <span className="text-primary/70 shrink-0 w-[140px] truncate" title={log.context}>
                        [{log.context}]
                      </span>

                      {/* Message */}
                      <span className={`flex-1 break-all ${log.level === 'error' ? 'text-error' : 'text-foreground/90'}`}>
                        {log.message}
                      </span>
                    </div>

                    {/* Expanded meta */}
                    <AnimatePresence>
                      {isExpanded && log.meta && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 ml-[95px] pl-4 border-l-2 border-grey-100 overflow-hidden"
                        >
                          <pre className="text-grey-500 text-[11px] whitespace-pre-wrap">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
