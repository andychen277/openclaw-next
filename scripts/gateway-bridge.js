#!/usr/bin/env node
// ============================================
// OpenClaw Gateway WebSocket Bridge
// Redis (Vercel) ←→ Gateway (localhost) via WS
// ============================================
//
// Usage:
//   node scripts/gateway-bridge.js
//
// Stop: Ctrl+C

const WebSocket = require('ws');
const crypto = require('crypto');

const GATEWAY_WS = 'ws://127.0.0.1:18789';
const VERCEL_URL = 'https://openclaw-next.vercel.app';
const GATEWAY_TOKEN = '12ea8dc8f7d66267ccb9c66c572c8ce9c33b92e71763b0116dce2e87d09c488f';
const POLL_INTERVAL = 10000; // 10s

// --- Helpers ---
const hex = () => crypto.randomBytes(8).toString('hex');
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

// --- WebSocket Client ---
let ws = null;
let connected = false;
let pendingCallbacks = new Map();
let runTaskMap = new Map(); // runId -> taskId

function sendReq(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('WebSocket not connected'));
    }
    const id = hex();
    const msg = { type: 'req', id, method, params };
    pendingCallbacks.set(id, { resolve, reject });
    ws.send(JSON.stringify(msg));
    setTimeout(() => {
      if (pendingCallbacks.has(id)) {
        pendingCallbacks.delete(id);
        reject(new Error(`Timeout: ${method}`));
      }
    }, 30000);
  });
}

function connectGateway() {
  return new Promise((resolve) => {
    log('Connecting to Gateway WebSocket...');
    ws = new WebSocket(GATEWAY_WS, {
      headers: { 'Origin': 'http://localhost:18789' }
    });

    let challengeReceived = false;

    ws.on('message', async (raw) => {
      const msg = JSON.parse(raw.toString());

      // Handle challenge → send connect
      if (msg.type === 'event' && msg.event === 'connect.challenge' && !challengeReceived) {
        challengeReceived = true;
        try {
          const res = await sendReq('connect', {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'gateway-client',
              version: 'dev',
              platform: 'node',
              mode: 'webchat',
              instanceId: hex(),
            },
            role: 'operator',
            scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
            caps: [],
            auth: { token: GATEWAY_TOKEN },
            userAgent: 'OpenClaw Bridge',
            locale: 'en',
          });

          if (res.type === 'hello-ok') {
            connected = true;
            log('✅ Gateway connected (protocol 3)');
            resolve(true);
          }
        } catch (e) {
          log(`❌ Connect failed: ${e.message}`);
          resolve(false);
        }
        return;
      }

      // Handle response to pending requests
      if (msg.type === 'res' && msg.id) {
        const cb = pendingCallbacks.get(msg.id);
        if (cb) {
          pendingCallbacks.delete(msg.id);
          if (msg.ok) {
            cb.resolve(msg.payload);
          } else {
            cb.reject(new Error(msg.error?.message || 'Unknown error'));
          }
        }
        return;
      }

      // Handle agent/chat events (log task progress)
      if (msg.type === 'event' && msg.event === 'chat') {
        const runId = msg.payload?.runId;
        const taskId = runTaskMap.get(runId);

        if (msg.payload?.state === 'final') {
          const content = msg.payload.message?.content;
          if (content?.[0]?.text) {
            const preview = content[0].text.substring(0, 100);
            log(`💬 Agent response: ${preview}...`);

            // Update status to done in Redis
            if (taskId) {
              fetch(`${VERCEL_URL}/api/tasks`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status: 'done', frontendStatus: 'done' }),
              }).catch(() => { });
              runTaskMap.delete(runId);
            }

            // Notify Telegram
            const taskSession = msg.payload.sessionKey || 'main';
            fetch(`${VERCEL_URL}/api/telegram/notify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                task: `[${taskSession}] Agent completed`,
                status: 'done',
                agent: taskSession,
              }),
            }).catch(() => { });
          }
        }
      }
    });

    ws.on('open', () => {
      log('WebSocket opened, waiting for challenge...');
    });

    ws.on('error', (e) => {
      log(`❌ WebSocket error: ${e.message}`);
      connected = false;
    });

    ws.on('close', () => {
      log('WebSocket closed');
      connected = false;
      // Auto-reconnect after 5s
      setTimeout(() => connectGateway(), 5000);
    });

    // Timeout if challenge never arrives
    setTimeout(() => {
      if (!challengeReceived) {
        log('⚠️ No challenge received, retrying...');
        resolve(false);
      }
    }, 10000);
  });
}

// --- Task Dispatcher ---
async function dispatchTask(task) {
  if (!connected) {
    log('⚠️ Gateway not connected, skipping task dispatch');
    return null;
  }

  const sessionKey = 'main'; // Dispatch to main agent (Ocean)
  const message = `[Task ${task.id}] ${task.task}`;

  try {
    const res = await sendReq('chat.send', {
      sessionKey,
      message,
      deliver: false,
      idempotencyKey: hex(),
    });

    if (res.status === 'started') {
      log(`🚀 Dispatched: "${task.task}" → ${sessionKey} (run: ${res.runId})`);
      return res.runId;
    }
  } catch (e) {
    log(`❌ Dispatch failed: ${e.message}`);
  }
  return null;
}

// --- Poll Redis for new tasks ---
async function pollTasks() {
  try {
    const res = await fetch(`${VERCEL_URL}/api/tasks`);
    const data = await res.json();

    // Only process tasks that are in 'todo' status
    const pendingTasks = (data.tasks || []).filter(t => t.status === 'todo');
    if (!pendingTasks.length) return;

    log(`📥 Found ${pendingTasks.length} pending task(s) in Redis`);

    for (const task of pendingTasks) {
      const runId = await dispatchTask(task);
      if (runId) {
        runTaskMap.set(runId, task.id);
        // Mark as ongoing in Redis
        await fetch(`${VERCEL_URL}/api/tasks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: task.id, status: 'in_progress', frontendStatus: 'ongoing' }),
        });
        log(`✅ Task ${task.id} marked as ongoing`);
      }
    }
  } catch (e) {
    log(`⚠️ Poll error: ${e.message}`);
  }
}

// --- Main ---
async function main() {
  console.log('');
  console.log('🌊 OpenClaw Gateway Bridge (WebSocket)');
  console.log('========================================');
  console.log(`Gateway: ${GATEWAY_WS}`);
  console.log(`Vercel:  ${VERCEL_URL}`);
  console.log(`Poll:    ${POLL_INTERVAL / 1000}s`);
  console.log('');

  await connectGateway();

  // Start polling
  setInterval(pollTasks, POLL_INTERVAL);
  // First poll immediately
  await pollTasks();
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
