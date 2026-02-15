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
const fs = require('fs');
const path = require('path');
const os = require('os');

const GATEWAY_WS = 'ws://127.0.0.1:18789';
const VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const GATEWAY_TOKEN = '12ea8dc8f7d66267ccb9c66c572c8ce9c33b92e71763b0116dce2e87d09c488f';
const POLL_INTERVAL = 10000; // 10s
const WORKSPACE_DIR = path.join(os.homedir(), '.openclaw', 'workspace');
const PROJECTS_JSON = path.join(os.homedir(), '.openclaw', 'projects.json');
const MOCK_MODE = process.argv.includes('--mock');

// Load .env.local for Direct Agent Mode
const envLocal = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocal)) {
  const envConfig = require('dotenv').parse(fs.readFileSync(envLocal));
  for (const k in envConfig) {
    if (!process.env[k]) process.env[k] = envConfig[k];
  }
}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENCLAW_MODEL = process.env.OPENCLAW_MODEL || 'google/gemini-2.0-flash-001';

// --- Helpers ---
const hex = () => crypto.randomBytes(8).toString('hex');
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

// Load projects registry
let projectsRegistry = null;
function loadProjectsRegistry() {
  if (projectsRegistry) return projectsRegistry;
  try {
    if (fs.existsSync(PROJECTS_JSON)) {
      projectsRegistry = JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8'));
      log(`📚 Loaded ${Object.keys(projectsRegistry.projects || {}).length} projects from registry`);
    }
  } catch (e) {
    log(`⚠️ Failed to load projects.json: ${e.message}`);
  }
  return projectsRegistry;
}

// Enrich task message with project info
function enrichTaskMessage(task) {
  const registry = loadProjectsRegistry();
  if (!registry) return task.task;

  const taskLower = task.task.toLowerCase();
  let enriched = task.task;
  let projectInfo = null;

  // Check aliases
  for (const [alias, projectId] of Object.entries(registry.aliases || {})) {
    if (taskLower.includes(alias.toLowerCase())) {
      projectInfo = registry.projects[projectId];
      if (projectInfo) {
        enriched = `${task.task}\n\n📁 專案資訊:\n- 名稱: ${projectInfo.name}\n- 路徑: ${projectInfo.path}${projectInfo.remote ? `\n- Remote: ${projectInfo.remote}` : ''}`;
        log(`🔍 Detected project: ${alias} → ${projectInfo.name}`);
        break;
      }
    }
  }

  // Check project IDs directly
  if (!projectInfo) {
    for (const [projectId, project] of Object.entries(registry.projects || {})) {
      if (taskLower.includes(projectId.toLowerCase())) {
        projectInfo = project;
        enriched = `${task.task}\n\n📁 專案資訊:\n- 名稱: ${project.name}\n- 路徑: ${project.path}${project.remote ? `\n- Remote: ${project.remote}` : ''}`;
        log(`🔍 Detected project: ${projectId} → ${project.name}`);
        break;
      }
    }
  }

  return enriched;
}

if (MOCK_MODE) {
  log('🎭 MOCK MODE ENABLED: Simulating Gateway connection');
} else if (OPENROUTER_KEY) {
  log(`🚀 DIRECT AGENT MODE ENABLED: Using ${OPENCLAW_MODEL}`);
} else {
  log('⚠️ No OPENROUTER_API_KEY found. Direct Agent Mode disabled.');
}

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
    if (MOCK_MODE) {
      connected = true;
      log('✅ (Mock) Gateway connected');
      resolve(true);
      return;
    }
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

// --- Memory Store ---
const memory = new Map(); // chatId -> array of messages

// --- Direct Agent Logic ---
async function processDirectTask(task) {
  if (!OPENROUTER_KEY) {
    log('❌ Direct Agent failed: Missing API Key');
    return false;
  }

  // Derive chatId from task ID if possible (tg_TIMESTAMP_ID -> unknown)
  // Or fallback to default TELEGRAM_CHAT_ID
  const chatId = process.env.TELEGRAM_CHAT_ID || "unknown";

  // Get history
  const history = memory.get(chatId) || [];

  log(`🤖 Direct Agent processing (Memory: ${history.length}): ${task.task}`);

  try {
    const messages = [
      { "role": "system", "content": "You are OpenClaw, an advanced AI agent. Respond professionally and concisely. You have access to previous context in this chat." },
      ...history,
      { "role": "user", "content": task.task }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": OPENCLAW_MODEL,
        "messages": messages,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "(No response content)";

    log(`💬 Agent Replying: ${reply.substring(0, 50)}...`);

    // Update Memory
    history.push({ "role": "user", "content": task.task });
    history.push({ "role": "assistant", "content": reply });
    memory.set(chatId, history.slice(-10)); // Keep last 10 messages

    // 1. Update Task to Done
    await fetch(`${VERCEL_URL}/api/tasks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: 'done', frontendStatus: 'done' }),
    });

    // 2. Notify Telegram (Streamlined)
    await fetch(`${VERCEL_URL}/api/telegram/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: reply, // Raw reply text
        status: 'done',
        agent: 'direct-agent', // This triggers the raw mode in notify route
      }),
    });

    return true;

  } catch (e) {
    log(`❌ Direct Agent Error: ${e.message}`);
    return false;
  }
}

// --- Task Dispatcher ---
async function dispatchTask(task) {
  // Priority 1: Mock Mode
  if (MOCK_MODE) {
    const runId = hex();
    log(`🚀 (Mock) Dispatched: "${task.task}" (run: ${runId})`);

    // Simulate processing delay then completion
    setTimeout(async () => {
      log(`💬 (Mock) Agent acting on: ${task.task}`);

      // Update status to done in Redis
      await fetch(`${VERCEL_URL}/api/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: 'done', frontendStatus: 'done' }),
      }).catch(() => { });

      // Notify Telegram
      await fetch(`${VERCEL_URL}/api/telegram/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: `[Mock Agent] Completed: ${task.task}`,
          status: 'done',
          agent: 'mock-agent',
        }),
      }).catch(() => { });

      runTaskMap.delete(runId);
    }, 5000); // 5s fake processing

    return runId;
  }

  // Priority 2: Local Gateway (if connected)
  if (connected) {
    const sessionKey = 'main'; // Dispatch to main agent (Ocean)
    const enrichedTask = enrichTaskMessage(task);
    const message = `[Task ${task.id}] ${enrichedTask}`;

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
  }

  // Priority 3: Direct Agent Fallback
  if (OPENROUTER_KEY) {
    log(`⚠️ Gateway unavailable, falling back to Direct Agent...`);
    await processDirectTask(task);
    return null; // Direct agent completed task inline
  } else {
    log('❌ Gateway unavailable and no OPENROUTER_API_KEY. Task pending.');
  }

  return null;
}

// --- Sync state to Vercel ---
async function syncToVercel(tasks) {
  try {
    // 1. Scan local workspace for outputs (.md files)
    let outputs = [];
    if (fs.existsSync(WORKSPACE_DIR)) {
      const files = fs.readdirSync(WORKSPACE_DIR);
      outputs = files
        .filter(f => f.endsWith('.md') && !['SOUL.md', 'AGENTS.md', 'BOOTSTRAP.md', 'IDENTITY.md', 'USER.md', 'HEARTBEAT.md', 'TOOLS.md'].includes(f))
        .map(f => {
          const stats = fs.statSync(path.join(WORKSPACE_DIR, f));
          return {
            filename: f,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    }

    // 2. Push tasks and outputs to Vercel
    const res = await fetch(`${VERCEL_URL}/api/gateway/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GATEWAY_SYNC_TOKEN || ''}`
      },
      body: JSON.stringify({
        tasks: {
          todo: tasks.filter(t => t.status === 'todo'),
          in_progress: tasks.filter(t => t.status === 'in_progress'),
          done: tasks.filter(t => t.status === 'done'),
        },
        outputs: outputs,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (text.startsWith('<!doctype')) {
        log(`⚠️ Vercel sync error: Received HTML (check VERCEL_URL: ${VERCEL_URL})`);
      } else {
        log(`⚠️ Vercel sync error: ${res.status}`);
      }
    }
  } catch (e) {
    log(`⚠️ Sync error: ${e.message}`);
  }
}

async function pollTasks() {
  try {
    const res = await fetch(`${VERCEL_URL}/api/tasks`);
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const allTasks = data.tasks || [];

    // Sync full state to Vercel so Dashboard sees updates
    await syncToVercel(allTasks);

    // Only process tasks that are in 'todo' status
    const pendingTasks = allTasks.filter(t => t.status === 'todo');
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

  if (OPENROUTER_KEY) {
    console.log('🔌 Direct Agent Mode: Skipping Local Gateway connection');
  } else {
    await connectGateway();
  }

  // Start polling
  setInterval(pollTasks, POLL_INTERVAL);
  // First poll immediately
  await pollTasks();
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
