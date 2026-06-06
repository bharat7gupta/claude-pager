// scripts/notify.mjs
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { loadConfig } from './config.mjs';
import { detectPlatform, sendNotification } from './platforms.mjs';
import { resolveSound, playSound } from './sounds.mjs';

export function classifyEvent(payload) {
  const { hook_event_name, notification_type } = payload;

  if (hook_event_name === 'Notification') {
    if (notification_type === 'idle_prompt') return 'idle';
    return null;
  }

  if (hook_event_name === 'PermissionRequest') return 'permission';

  if (hook_event_name === 'Stop' || hook_event_name === 'TaskCompleted') {
    return 'completion';
  }

  return null;
}

export function buildTitle(payload) {
  if (payload.cwd) return `Claude Pager - ${basename(payload.cwd)}`;
  return 'Claude Pager';
}

function extractToolSummary(payload) {
  const { tool_name, tool_input } = payload;
  if (!tool_name) return null;

  let detail = '';
  if (tool_input) {
    if (tool_input.command) detail = tool_input.command;
    else if (tool_input.file_path) detail = tool_input.file_path;
  }

  return detail ? `Allow ${tool_name}: ${detail}?` : `Allow ${tool_name}?`;
}

export function buildBody(eventType, payload) {
  if (eventType === 'idle') {
    return payload.message || 'Waiting for your input';
  }

  if (eventType === 'permission') {
    return extractToolSummary(payload) || payload.message || 'Needs permission';
  }

  // completion
  if (payload.last_assistant_message) {
    const firstLine = payload.last_assistant_message.split('\n')[0].trim();
    if (firstLine) return firstLine.length > 120 ? firstLine.slice(0, 120) + '...' : firstLine;
  }
  return 'Task complete';
}

async function main() {
  let raw;
  try {
    raw = readFileSync(0, 'utf8').trim();
  } catch {
    process.exit(0);
  }

  if (!raw) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.stderr.write('[claude-pager] failed to parse stdin JSON\n');
    process.exit(0);
  }

  const eventType = classifyEvent(payload);
  if (!eventType) process.exit(0);

  const config = loadConfig();
  if (!config[eventType].enabled) process.exit(0);

  const plat = detectPlatform();
  const title = buildTitle(payload);
  const body = buildBody(eventType, payload);

  sendNotification(plat, title, body, process.env);

  const soundPreset = resolveSound(config[eventType].sound, eventType);
  playSound(soundPreset, plat);
}

// Only run main when executed directly, not when imported for testing
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
