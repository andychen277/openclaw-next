#!/bin/bash
# ============================================
# OpenClaw Gateway Bridge
# 雙向同步 Gateway (本機) ←→ Vercel (雲端)
# ============================================
#
# 使用方式:
#   chmod +x scripts/gateway-bridge.sh
#   ./scripts/gateway-bridge.sh
#
# 停止: Ctrl+C
#
# 功能:
#   1. Gateway → Vercel: 推送任務狀態到 Dashboard
#   2. Vercel → Gateway: 拉取 Telegram/Dashboard 建立的任務
#   3. 任務完成時自動通知 Telegram

GATEWAY_URL="http://localhost:18789"
VERCEL_URL="https://openclaw-next.vercel.app"
GATEWAY_TOKEN="12ea8dc8f7d66267ccb9c66c572c8ce9c33b92e71763b0116dce2e87d09c488f"
SYNC_INTERVAL=10

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "[$(date '+%H:%M:%S')] $1"; }

echo ""
echo "🌊 OpenClaw Gateway Bridge"
echo "=========================="
echo "Gateway: $GATEWAY_URL"
echo "Vercel:  $VERCEL_URL"
echo "Interval: ${SYNC_INTERVAL}s"
echo ""

PREV_DONE_IDS=""

while true; do
  # ─── 1. Gateway → Vercel: Push task state ───
  gateway_tasks=$(curl -sf \
    -H "Authorization: Bearer $GATEWAY_TOKEN" \
    "$GATEWAY_URL/data/tasks.json" 2>/dev/null)

  if [ $? -eq 0 ] && [ -n "$gateway_tasks" ] && [ "$gateway_tasks" != "null" ]; then
    # Push to Vercel
    sync_ok=$(curl -sf -o /dev/null -w "%{http_code}" \
      -X POST "$VERCEL_URL/api/gateway/sync" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $GATEWAY_TOKEN" \
      -d "$gateway_tasks" 2>/dev/null)

    if [ "$sync_ok" = "200" ]; then
      counts=$(echo "$gateway_tasks" | python3 -c "
import sys, json
d = json.load(sys.stdin)
t = len(d.get('todo',[]))
p = len(d.get('in_progress',[]))
dn = len(d.get('done',[]))
print(f'{t+p+dn} total ({t} todo, {p} active, {dn} done)')
" 2>/dev/null || echo "?")
      log "${GREEN}✅ Gateway → Vercel${NC}: $counts"

      # Check for newly completed tasks → notify Telegram
      curr_done_ids=$(echo "$gateway_tasks" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for t in d.get('done', []):
    print(t.get('id', ''))
" 2>/dev/null | sort)

      if [ -n "$PREV_DONE_IDS" ] && [ -n "$curr_done_ids" ]; then
        new_done=$(comm -13 <(echo "$PREV_DONE_IDS") <(echo "$curr_done_ids"))
        if [ -n "$new_done" ]; then
          for done_id in $new_done; do
            task_desc=$(echo "$gateway_tasks" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for t in d.get('done', []):
    if t.get('id') == '$done_id':
        print(t.get('task', 'Unknown task'))
        break
" 2>/dev/null)
            if [ -n "$task_desc" ]; then
              curl -sf -X POST "$VERCEL_URL/api/telegram/notify" \
                -H "Content-Type: application/json" \
                -d "{\"task\": \"$task_desc\", \"status\": \"done\"}" > /dev/null 2>&1
              log "${GREEN}📢 Telegram${NC}: 任務完成 → $task_desc"
            fi
          done
        fi
      fi
      PREV_DONE_IDS="$curr_done_ids"
    else
      log "${YELLOW}⚠️  Gateway → Vercel${NC}: sync failed ($sync_ok)"
    fi
  else
    log "${RED}⚠️  Gateway not available${NC}"
  fi

  # ─── 2. Vercel → Gateway: Pull new tasks ───
  server_resp=$(curl -sf "$VERCEL_URL/api/tasks" 2>/dev/null)

  if [ $? -eq 0 ] && [ -n "$server_resp" ]; then
    task_lines=$(echo "$server_resp" | python3 -c "
import sys, json
d = json.load(sys.stdin)
tasks = d.get('tasks', [])
print(len(tasks))
for t in tasks:
    print(json.dumps(t))
" 2>/dev/null)

    count=$(echo "$task_lines" | head -1)

    if [ "$count" -gt 0 ] 2>/dev/null; then
      pushed=0
      echo "$task_lines" | tail -n +2 | while IFS= read -r task_json; do
        if [ -n "$task_json" ]; then
          curl -sf -X POST "$GATEWAY_URL/add_task" \
            -H "Authorization: Bearer $GATEWAY_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$task_json" > /dev/null 2>&1
        fi
      done

      # Clear synced tasks from Vercel server store
      curl -sf -X DELETE "$VERCEL_URL/api/tasks" \
        -H "Content-Type: application/json" \
        -d '{}' > /dev/null 2>&1

      log "${GREEN}📥 Vercel → Gateway${NC}: $count new tasks pushed"
    fi
  fi

  sleep "$SYNC_INTERVAL"
done
