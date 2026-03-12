'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Copy, CheckCircle, ExternalLink } from 'lucide-react';

export default function BadgePage() {
  const [copied, setCopied] = useState<string | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const badgeUrl = `${backendUrl}/status/badge.svg`;

  const snippets = [
    {
      label: 'Markdown',
      code: `[![BeeSeek Status](${badgeUrl})](https://pulse.beeseek.site)`,
    },
    {
      label: 'HTML',
      code: `<a href="https://pulse.beeseek.site"><img src="${badgeUrl}" alt="BeeSeek Status" /></a>`,
    },
    {
      label: 'reStructuredText',
      code: `.. image:: ${badgeUrl}\n   :target: https://pulse.beeseek.site\n   :alt: BeeSeek Status`,
    },
    {
      label: 'Image URL',
      code: badgeUrl,
    },
  ];

  const copyToClipboard = async (code: string, label: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 text-foreground max-w-3xl mx-auto">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex p-4 bg-primary/10 rounded-3xl mb-6"
        >
          <BadgeCheck size={40} className="text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Status <span className="text-primary">Badge</span>
        </h1>
        <p className="text-grey-500 font-medium mt-2">
          Embed a live status badge in your README, docs, or website
        </p>
      </div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl border border-border p-8 text-center"
      >
        <h3 className="text-sm font-bold text-grey-500 uppercase tracking-wider mb-6">Live Preview</h3>
        <div className="flex justify-center items-center gap-4 py-8">
          <div className="bg-background rounded-2xl p-8 border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt="BeeSeek Status Badge" className="h-5" />
          </div>
          <div className="bg-white rounded-2xl p-8 border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt="BeeSeek Status Badge" className="h-5" />
          </div>
        </div>
        <p className="text-xs text-grey-500">Badge updates every 30 seconds with live status</p>
      </motion.div>

      {/* Embed Codes */}
      <div className="space-y-4">
        {snippets.map((snippet, i) => (
          <motion.div
            key={snippet.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface rounded-2xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-foreground">{snippet.label}</span>
              <button
                onClick={() => copyToClipboard(snippet.code, snippet.label)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-background text-grey-500 hover:text-primary transition-colors"
              >
                {copied === snippet.label ? (
                  <><CheckCircle size={14} className="text-success" /> Copied!</>
                ) : (
                  <><Copy size={14} /> Copy</>
                )}
              </button>
            </div>
            <pre className="text-xs text-grey-500 bg-background rounded-xl p-4 overflow-x-auto font-mono whitespace-pre-wrap break-all">
              {snippet.code}
            </pre>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <a
          href={badgeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          <ExternalLink size={14} /> Open badge directly
        </a>
      </div>
    </div>
  );
}
