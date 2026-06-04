// tests/sounds.test.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSound, buildSoundCommand } from '../scripts/sounds.mjs';

describe('resolveSound', () => {
  it('resolves "default" for idle to hero', () => {
    assert.strictEqual(resolveSound('default', 'idle'), 'hero');
  });

  it('resolves "default" for permission to ping', () => {
    assert.strictEqual(resolveSound('default', 'permission'), 'ping');
  });

  it('resolves "default" for completion to glass', () => {
    assert.strictEqual(resolveSound('default', 'completion'), 'glass');
  });

  it('passes through named presets unchanged', () => {
    assert.strictEqual(resolveSound('pop', 'idle'), 'pop');
  });

  it('returns "none" for "none"', () => {
    assert.strictEqual(resolveSound('none', 'idle'), 'none');
  });
});

describe('buildSoundCommand', () => {
  it('returns null for "none" preset', () => {
    assert.strictEqual(buildSoundCommand('none', 'darwin'), null);
  });

  it('returns afplay command for macOS', () => {
    const cmd = buildSoundCommand('ping', 'darwin');
    assert.deepStrictEqual(cmd, {
      command: 'afplay',
      args: ['/System/Library/Sounds/Ping.aiff'],
    });
  });

  it('returns paplay command for Linux', () => {
    const cmd = buildSoundCommand('glass', 'linux');
    assert.deepStrictEqual(cmd, {
      command: 'paplay',
      args: ['/usr/share/sounds/freedesktop/stereo/dialog-information.oga'],
      fallback: {
        command: 'aplay',
        args: ['/usr/share/sounds/freedesktop/stereo/dialog-information.oga'],
      },
    });
  });

  it('returns powershell command for Windows', () => {
    const cmd = buildSoundCommand('ping', 'win32');
    assert.deepStrictEqual(cmd, {
      command: 'powershell',
      args: ['-NoProfile', '-Command', '[System.Media.SystemSounds]::Beep.Play()'],
    });
  });
});
