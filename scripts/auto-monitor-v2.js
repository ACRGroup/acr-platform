#!/usr/bin/env node
/**
 * ACR Bot Monitor v2 — Real-Time Activity Tracking
 *
 * Improvements over v1:
 *   - 5-second polling (vs 30s)
 *   - Activity type detection (idle, reading, coding, responding)
 *   - Health status (uptime, last error, response time)
 *   - Git activity tracking (last commit, branch, uncommitted changes)
 *   - Session detail (model, channel, message count)
 *   - Keeps 1-hour activity history in Firestore
 *
 * Usage:
 *   BOT_ID=r2d2 node scripts/auto-monitor-v2.js
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

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10); // 5 seconds
const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;
const HISTORY_RETENTION_MS = 60 * 60 * 1000; // 1 hour

let lastStatus = null;
let lastGitHash = null;
let startedAt = new Date().toISOString();
let errorCount = 0;
let pollCount = 0;

// ============================================================
// GATEWAY STATUS
// ============================================================

function getGatewayStatus() {
  try {
    const start = Date.now();
    const raw = execSync('openclaw gateway call status --json 2>/dev/null || /opt/homebrew/bin/openclaw gateway call status --json 2>/dev/null', {
      timeout: 8000,
      encoding: 'utf-8',
      shell: '/bin/zsh',
    });
    const responseTimeMs = Date.now() - start;
    const data = JSON.parse(raw);
    return { data, responseTimeMs, healthy: true };
  } catch (err) {
    errorCount++;
    return { data: null, responseTimeMs: -1, healthy: false, error: err.message };
  }
}

// ============================================================
// GIT ACTIVITY
// ============================================================

function getGitActivity() {
  try {
    const hash = execSync('cd ~/Desktop/ACR-3 && git rev-parse --short HEAD 2>/dev/null', {
      timeout: 3000, encoding: 'utf-8', shell: '/bin/zsh',
    }).trim();

    const message = execSync('cd ~/Desktop/ACR-3 && git log -1 --format="%s" 2>/dev/null', {
      timeout: 3000, encoding: 'utf-8', shell: '/bin/zsh',
    }).trim();

    const branch = execSync('cd ~/Desktop/ACR-3 && git branch --show-current 2>/dev/null', {
      timeout: 3000, encoding: 'utf-8', shell: '/bin/zsh',
    }).trim();

    const dirty = execSync('cd ~/Desktop/ACR-3 && git status --porcelain 2>/dev/null | wc -l', {
      timeout: 3000, encoding: 'utf-8', shell: '/bin/zsh',
    }).trim();

    const isNewCommit = lastGitHash !== null && hash !== lastGitHash;
    lastGitHash = hash;

    return {
      lastCommitHash: hash,
      lastCommitMessage: message.substring(0, 100),
      branch,
      uncommittedChanges: parseInt(dirty, 10) || 0,
      justCommitted: isNewCommit,
    };
  } catch {
    return {
      lastCommitHash: 'unknown',
      lastCommitMessage: '',
      branch: 'unknown',
      uncommittedChanges: 0,
      justCommitted: false,
    };
  }
}

// ============================================================
// ACTIVITY DETECTION
// ============================================================

function detectActivity(gatewayResult, gitActivity) {
  if (!gatewayResult.healthy) return 'offline';

  const sessions = gatewayResult.data?.sessions?.recent || [];
  const activeSessions = sessions.filter(s => {
    if (typeof s.age === 'number') return s.age < ACTIVE_THRESHOLD_MS;
    if (typeof s.updatedAt === 'number') return (Date.now() - s.updatedAt) < ACTIVE_THRESHOLD_MS;
    return false;
  });

  if (gitActivity.justCommitted) return 'coding';
  if (gitActivity.uncommittedChanges > 0 && activeSessions.length > 0) return 'coding';
  if (activeSessions.length > 0) return 'responding';
  return 'idle';
}

// ============================================================
// PUSH TO FIRESTORE
// ============================================================

async function pushStatus(activity, gatewayResult, gitActivity) {
  const now = new Date();
  const docRef = db.collection('teamStatus').doc(BOT_ID);

  const statusData = {
    botId: BOT_ID,
    status: activity === 'idle' ? 'idle' : 'working',
    activity, // idle, responding, coding, offline
    currentTask: '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    // Health
    health: {
      online: gatewayResult.healthy,
      responseTimeMs: gatewayResult.responseTimeMs,
      upSince: startedAt,
      errorCount,
      pollCount,
      lastError: gatewayResult.error || null,
    },
    // Git activity
    git: {
      lastCommitHash: gitActivity.lastCommitHash,
      lastCommitMessage: gitActivity.lastCommitMessage,
      branch: gitActivity.branch,
      uncommittedChanges: gitActivity.uncommittedChanges,
    },
    // Session info
    sessions: {
      active: (gatewayResult.data?.sessions?.recent || []).filter(s => {
        if (typeof s.age === 'number') return s.age < ACTIVE_THRESHOLD_MS;
        return false;
      }).length,
      total: (gatewayResult.data?.sessions?.recent || []).length,
    },
  };

  // Determine current task from active sessions
  const activeSessions = (gatewayResult.data?.sessions?.recent || []).filter(s => {
    if (typeof s.age === 'number') return s.age < ACTIVE_THRESHOLD_MS;
    return false;
  });
  if (activeSessions.length > 0) {
    statusData.currentTask = activeSessions.map(s => s.kind || s.key || 'unknown').join(', ');
  }

  await docRef.set(statusData, { merge: true });

  // Activity history (keep 1 hour)
  const historyRef = db.collection('teamStatus').doc(BOT_ID)
    .collection('history').doc(now.toISOString().replace(/[:.]/g, '-'));

  await historyRef.set({
    activity,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    responseTimeMs: gatewayResult.responseTimeMs,
    activeSessions: activeSessions.length,
    gitHash: gitActivity.lastCommitHash,
    uncommitted: gitActivity.uncommittedChanges,
  });

  // Cleanup old history (older than 1 hour)
  try {
    const cutoff = new Date(Date.now() - HISTORY_RETENTION_MS);
    const oldDocs = await db.collection('teamStatus').doc(BOT_ID)
      .collection('history')
      .where('timestamp', '<', cutoff)
      .limit(50)
      .get();

    const batch = db.batch();
    oldDocs.forEach(doc => batch.delete(doc.ref));
    if (!oldDocs.empty) await batch.commit();
  } catch { /* cleanup is best-effort */ }

  const statusChanged = lastStatus !== activity;
  lastStatus = activity;

  if (statusChanged || pollCount % 12 === 0) { // Log every minute or on status change
    console.log(`[${now.toISOString()}] ${BOT_ID}: ${activity} | git:${gitActivity.lastCommitHash} | sessions:${activeSessions.length} | health:${gatewayResult.responseTimeMs}ms`);
  }
}

// ============================================================
// MAIN LOOP
// ============================================================

async function poll() {
  pollCount++;
  const gatewayResult = getGatewayStatus();
  const gitActivity = getGitActivity();
  const activity = detectActivity(gatewayResult, gitActivity);
  await pushStatus(activity, gatewayResult, gitActivity);
}

poll().then(() => {
  setInterval(poll, POLL_INTERVAL);
  console.log(`[${new Date().toISOString()}] Monitor v2 started: ${BOT_ID} every ${POLL_INTERVAL / 1000}s`);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
