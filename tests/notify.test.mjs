// tests/notify.test.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyEvent, buildBody, buildTitle } from '../scripts/notify.mjs';

describe('classifyEvent', () => {
  it('classifies Notification + idle_prompt as idle', () => {
    const result = classifyEvent({
      hook_event_name: 'Notification',
      notification_type: 'idle_prompt',
    });
    assert.strictEqual(result, 'idle');
  });

  it('classifies Notification + permission_prompt as permission', () => {
    const result = classifyEvent({
      hook_event_name: 'Notification',
      notification_type: 'permission_prompt',
    });
    assert.strictEqual(result, 'permission');
  });

  it('classifies Stop as completion', () => {
    const result = classifyEvent({ hook_event_name: 'Stop' });
    assert.strictEqual(result, 'completion');
  });

  it('classifies TaskCompleted as completion', () => {
    const result = classifyEvent({ hook_event_name: 'TaskCompleted' });
    assert.strictEqual(result, 'completion');
  });

  it('returns null for unknown events', () => {
    const result = classifyEvent({ hook_event_name: 'SessionStart' });
    assert.strictEqual(result, null);
  });

  it('returns null for Notification with unknown sub-type', () => {
    const result = classifyEvent({
      hook_event_name: 'Notification',
      notification_type: 'auth_success',
    });
    assert.strictEqual(result, null);
  });
});

describe('buildTitle', () => {
  it('extracts basename from cwd', () => {
    assert.strictEqual(buildTitle({ cwd: '/Users/me/projects/my-app' }), 'my-app');
  });

  it('falls back to "Claude Code" when cwd is missing', () => {
    assert.strictEqual(buildTitle({}), 'Claude Code');
  });

  it('falls back to "Claude Code" when cwd is empty', () => {
    assert.strictEqual(buildTitle({ cwd: '' }), 'Claude Code');
  });
});

describe('buildBody', () => {
  it('uses message field for idle events', () => {
    const body = buildBody('idle', { message: 'What should I do next?' });
    assert.strictEqual(body, 'What should I do next?');
  });

  it('falls back for idle with no message', () => {
    const body = buildBody('idle', {});
    assert.strictEqual(body, 'Waiting for your input');
  });

  it('uses tool_name + tool_input for permission', () => {
    const body = buildBody('permission', {
      tool_name: 'Bash',
      tool_input: { command: 'npm test' },
    });
    assert.strictEqual(body, 'Allow Bash: npm test?');
  });

  it('uses tool_name + file_path from tool_input for permission', () => {
    const body = buildBody('permission', {
      tool_name: 'Edit',
      tool_input: { file_path: 'src/index.ts' },
    });
    assert.strictEqual(body, 'Allow Edit: src/index.ts?');
  });

  it('falls back to message for permission with no tool info', () => {
    const body = buildBody('permission', { message: 'Approve this action' });
    assert.strictEqual(body, 'Approve this action');
  });

  it('falls back to default for permission with nothing', () => {
    const body = buildBody('permission', {});
    assert.strictEqual(body, 'Needs permission');
  });

  it('returns static text for completion', () => {
    const body = buildBody('completion', {});
    assert.strictEqual(body, 'Task complete');
  });
});
