'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity,
  Terminal,
  History,
  X,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Server,
  Wrench,
  Bell,
  BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { label: 'Live Pulse', icon: Activity, href: '/' },
  { label: 'System Nodes', icon: Terminal, href: '/status' },
  { label: 'Infrastructure', icon: Server, href: '/infrastructure' },
  { label: 'Incident Timeline', icon: History, href: '/incidents' },
  { label: 'Maintenance', icon: Wrench, href: '/maintenance' },
  { label: 'Subscribe', icon: Bell, href: '/subscribe' },
  { label: 'Status Badge', icon: BadgeCheck, href: '/badge' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — hidden on mobile unless menu open */}
      <AnimatePresence>
        {(isSidebarOpen || isMobileMenuOpen) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0, width: isSidebarOpen ? 280 : 80 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "relative flex flex-col border-r border-border bg-surface z-50",
              "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[280px] max-md:shadow-2xl"
            )}
          >
            <div className="flex h-20 items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-primary/20 blur animate-pulse" />
                  <Activity size={28} className="text-primary relative" />
                </div>
                <span className="text-xl font-bold text-primary tracking-tight max-md:block">
                  BeeSeek PULSE
                </span>
              </div>
              {/* Close button on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-white/5 transition-colors text-grey-500 md:hidden"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-xl px-4 py-3 transition-colors group",
                      isActive 
                        ? "bg-primary text-background shadow-lg shadow-primary/10" 
                        : "text-grey-500 hover:bg-white/5 hover:text-primary"
                    )}
                  >
                    <Icon 
                      size={24} 
                      className={cn(isActive ? "text-background" : "text-grey-500 group-hover:text-primary")}
                    />
                    {(isSidebarOpen || isMobileMenuOpen) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-4 font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-border bg-surface px-4 md:px-8">
          <div className="flex items-center gap-2">
            {/* Hamburger on mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 hover:bg-white/5 transition-colors text-grey-500 md:hidden"
            >
              <Menu size={24} />
            </button>
            {/* Sidebar toggle on desktop */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 hover:bg-white/5 transition-colors text-grey-500 hidden md:block"
            >
              {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeft size={24} />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-xs font-bold border border-success/20">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Systems Live
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
