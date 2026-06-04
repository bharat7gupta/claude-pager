// tests/config.test.mjs
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../scripts/config.mjs';

describe('loadConfig', () => {
  const savedEnv = {};

  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('CLAUDE_PLUGIN_OPTION_')) {
        savedEnv[key] = process.env[key];
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('CLAUDE_PLUGIN_OPTION_')) {
        delete process.env[key];
      }
    }
    for (const [key, val] of Object.entries(savedEnv)) {
      process.env[key] = val;
    }
  });

  it('returns defaults when no env vars set', () => {
    const config = loadConfig();
    assert.deepStrictEqual(config, {
      idle: { enabled: true, sound: 'default' },
      permission: { enabled: true, sound: 'default' },
      completion: { enabled: true, sound: 'default' },
    });
  });

  it('reads enabled/disabled from env vars', () => {
    process.env.CLAUDE_PLUGIN_OPTION_idle_enabled = 'off';
    process.env.CLAUDE_PLUGIN_OPTION_permission_enabled = 'on';
    process.env.CLAUDE_PLUGIN_OPTION_completion_enabled = 'off';
    const config = loadConfig();
    assert.strictEqual(config.idle.enabled, false);
    assert.strictEqual(config.permission.enabled, true);
    assert.strictEqual(config.completion.enabled, false);
  });

  it('reads sound presets from env vars', () => {
    process.env.CLAUDE_PLUGIN_OPTION_idle_sound = 'hero';
    process.env.CLAUDE_PLUGIN_OPTION_permission_sound = 'glass';
    process.env.CLAUDE_PLUGIN_OPTION_completion_sound = 'none';
    const config = loadConfig();
    assert.strictEqual(config.idle.sound, 'hero');
    assert.strictEqual(config.permission.sound, 'glass');
    assert.strictEqual(config.completion.sound, 'none');
  });

  it('treats unknown values for enabled as true', () => {
    process.env.CLAUDE_PLUGIN_OPTION_idle_enabled = 'banana';
    const config = loadConfig();
    assert.strictEqual(config.idle.enabled, true);
  });
});
