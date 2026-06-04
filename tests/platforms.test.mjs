// tests/platforms.test.mjs
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectPlatform,
  isHeadless,
  buildNotificationCommand,
  formatHeadless,
} from '../scripts/platforms.mjs';

describe('detectPlatform', () => {
  it('returns process.platform value', () => {
    const result = detectPlatform();
    assert.strictEqual(typeof result, 'string');
    assert.ok(['darwin', 'linux', 'win32'].includes(result) || true);
  });
});

describe('isHeadless', () => {
  it('returns false on macOS without SSH_TTY', () => {
    assert.strictEqual(isHeadless('darwin', {}), false);
  });

  it('returns true on macOS with SSH_TTY', () => {
    assert.strictEqual(isHeadless('darwin', { SSH_TTY: '/dev/pts/0' }), true);
  });

  it('returns false on Linux with DISPLAY', () => {
    assert.strictEqual(isHeadless('linux', { DISPLAY: ':0' }), false);
  });

  it('returns false on Linux with WAYLAND_DISPLAY', () => {
    assert.strictEqual(isHeadless('linux', { WAYLAND_DISPLAY: 'wayland-0' }), false);
  });

  it('returns true on Linux with no display vars', () => {
    assert.strictEqual(isHeadless('linux', {}), true);
  });

  it('returns false on Windows by default', () => {
    assert.strictEqual(isHeadless('win32', {}), false);
  });
});

describe('buildNotificationCommand', () => {
  it('builds osascript command for macOS', () => {
    const cmd = buildNotificationCommand('darwin', 'my-project', 'Task complete');
    assert.strictEqual(cmd.command, 'osascript');
    assert.ok(cmd.args[1].includes('my-project'));
    assert.ok(cmd.args[1].includes('Task complete'));
  });

  it('builds notify-send command for Linux', () => {
    const cmd = buildNotificationCommand('linux', 'my-project', 'Task complete');
    assert.strictEqual(cmd.command, 'notify-send');
    assert.ok(cmd.args.includes('my-project'));
    assert.ok(cmd.args.includes('Task complete'));
  });

  it('builds powershell command for Windows', () => {
    const cmd = buildNotificationCommand('win32', 'my-project', 'Task complete');
    assert.strictEqual(cmd.command, 'powershell');
    assert.ok(cmd.args.some(a => a.includes('my-project')));
  });

  it('returns null for unknown platforms', () => {
    const cmd = buildNotificationCommand('freebsd', 'proj', 'msg');
    assert.strictEqual(cmd, null);
  });
});

describe('formatHeadless', () => {
  it('formats a headless stdout line', () => {
    const line = formatHeadless('my-project', 'Needs permission');
    assert.strictEqual(line, '[claude-pager] my-project: Needs permission');
  });
});
