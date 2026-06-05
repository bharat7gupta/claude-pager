// scripts/platforms.mjs
import { spawn, execFileSync } from 'node:child_process';
import { platform } from 'node:os';

let _hasTerminalNotifier;
function hasTerminalNotifier() {
  if (_hasTerminalNotifier === undefined) {
    try {
      execFileSync('which', ['terminal-notifier'], { stdio: 'ignore' });
      _hasTerminalNotifier = true;
    } catch {
      _hasTerminalNotifier = false;
    }
  }
  return _hasTerminalNotifier;
}

export function detectPlatform() {
  return platform();
}

export function isHeadless(plat, env) {
  if (plat === 'darwin') {
    return !!env.SSH_TTY;
  }
  if (plat === 'linux') {
    return !env.DISPLAY && !env.WAYLAND_DISPLAY;
  }
  // Windows: assume GUI available
  return false;
}

function escapeAppleScript(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function buildNotificationCommand(plat, title, body) {
  if (plat === 'darwin') {
    if (hasTerminalNotifier()) {
      return { command: 'terminal-notifier', args: ['-title', title, '-message', body, '-group', 'claude-pager'] };
    }
    const escaped = `display notification "${escapeAppleScript(body)}" with title "${escapeAppleScript(title)}"`;
    return { command: 'osascript', args: ['-e', escaped] };
  }

  if (plat === 'linux') {
    return { command: 'notify-send', args: [title, body] };
  }

  if (plat === 'win32') {
    const ps = `
      Add-Type -AssemblyName System.Windows.Forms;
      $n = New-Object System.Windows.Forms.NotifyIcon;
      $n.Icon = [System.Drawing.SystemIcons]::Information;
      $n.Visible = $true;
      $n.ShowBalloonTip(5000, '${title.replace(/'/g, "''")}', '${body.replace(/'/g, "''")}', 'Info');
      Start-Sleep -Seconds 6;
      $n.Dispose();
    `.trim();
    return { command: 'powershell', args: ['-NoProfile', '-Command', ps] };
  }

  return null;
}

export function formatHeadless(title, body) {
  return `[claude-pager] ${title}: ${body}`;
}

export function sendNotification(plat, title, body, env) {
  if (isHeadless(plat, env)) {
    const line = formatHeadless(title, body);
    process.stdout.write(line + '\n');
    process.stdout.write('\x07'); // terminal bell
    return;
  }

  const cmd = buildNotificationCommand(plat, title, body);
  if (!cmd) {
    // Unknown platform — headless fallback
    const line = formatHeadless(title, body);
    process.stdout.write(line + '\n');
    process.stdout.write('\x07');
    return;
  }

  try {
    const child = spawn(cmd.command, cmd.args, {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    child.on('error', () => {
      // Notifier binary missing — headless fallback
      const line = formatHeadless(title, body);
      process.stderr.write(`[claude-pager] notification command failed, falling back to stdout\n`);
      process.stdout.write(line + '\n');
      process.stdout.write('\x07');
    });
  } catch {
    const line = formatHeadless(title, body);
    process.stdout.write(line + '\n');
    process.stdout.write('\x07');
  }
}
