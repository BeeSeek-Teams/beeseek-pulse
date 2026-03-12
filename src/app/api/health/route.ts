import { NextResponse } from 'next/server';

/**
 * Pulse self-health check — confirms the Pulse application itself is running.
 * For backend health, use /api/backend/health which proxies to the NestJS backend.
 */
export async function GET() {
  return NextResponse.json({
    status: 'up',
    service: 'beeseek-pulse',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
}
