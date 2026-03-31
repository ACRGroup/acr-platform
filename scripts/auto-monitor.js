#!/usr/bin/env node
/**
 * ACR Bot Auto-Monitor
 * Polls `openclaw gateway call status --json` every 30 seconds,
 * detects active sessions, and pushes status to Firestore.
 *
 * Usage:
 *   GOOGLE_CLOUD_PROJECT=acr-portal-live BOT_ID=vision node scripts/auto-monitor.js
 *
 * Environment:
 *   BOT_ID  - one of: jarvis, vision, r2d2
 *   GOOGLE_CLOUD_PROJECT - Firebase project id (acr-portal-live)
 *   POLL_INTERVAL_MS - polling interval in ms (default: 30000)
 */

const { execSync } = require('child_process');
const admin = require('firebase-admin');

const BOT_ID = process.env.BOT_ID;
if (!BOT_ID) {
  console.error('ERROR: Set BOT_ID env var (jarvis | vision | r2d2)');
  process.exit(1);
}

admin.initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT || 'acr-portal-live' });
const db = admin.firestore();

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '30000', 10);
const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

function getGatewayStatus() {
  try {
    const raw = execSync('openclaw gateway call status --json 2>/dev/null || /opt/homebrew/bin/openclaw gateway call status --json 2>/dev/null', {
      timeout: 10000,
      encoding: 'utf-8',
      shell: '/bin/zsh',
    });
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to get gateway status:`, err.message);
    return null;
  }
}

function isActive(statusData) {
  if (!statusData || !statusData.sessions) return false;
  const now = Date.now();
  return statusData.sessions.some(s => {
    const lastActive = s.lastActiveAt ? new Date(s.lastActiveAt).getTime() : 0;
    return (now - lastActive) < ACTIVE_THRESHOLD_MS;
  });
}

async function pushStatus(status, currentTask) {
  const docRef = db.collection('teamStatus').doc(BOT_ID);
  await docRef.set({
    status,
    currentTask: currentTask || '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function poll() {
  const statusData = getGatewayStatus();
  const active = isActive(statusData);

  const status = active ? 'working' : 'idle';
  let currentTask = '';

  if (active && statusData && statusData.sessions) {
    const activeSessions = statusData.sessions
      .filter(s => {
        const lastActive = s.lastActiveAt ? new Date(s.lastActiveAt).getTime() : 0;
        return (Date.now() - lastActive) < ACTIVE_THRESHOLD_MS;
      })
      .map(s => s.label || s.sessionKey || 'unknown');
    currentTask = activeSessions.join(', ');
  }

  await pushStatus(status, currentTask);
  console.log(`[${new Date().toISOString()}] ${BOT_ID}: ${status}${currentTask ? ' — ' + currentTask : ''}`);
}

// Run immediately, then poll
poll().then(() => {
  setInterval(poll, POLL_INTERVAL);
  console.log(`[${new Date().toISOString()}] Monitoring ${BOT_ID} every ${POLL_INTERVAL / 1000}s`);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
