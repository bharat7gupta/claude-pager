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

  it('classifies PermissionRequest as permission', () => {
    const result = classifyEvent({ hook_event_name: 'PermissionRequest' });
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
  it('extracts basename from cwd with prefix', () => {
    assert.strictEqual(buildTitle({ cwd: '/Users/me/projects/my-app' }), 'Claude Pager - my-app');
  });

  it('falls back to "Claude Pager" when cwd is missing', () => {
    assert.strictEqual(buildTitle({}), 'Claude Pager');
  });

  it('falls back to "Claude Pager" when cwd is empty', () => {
    assert.strictEqual(buildTitle({ cwd: '' }), 'Claude Pager');
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

  it('returns static text for completion with no message', () => {
    const body = buildBody('completion', {});
    assert.strictEqual(body, 'Task complete');
  });

  it('uses first line of last_assistant_message for completion', () => {
    const body = buildBody('completion', {
      last_assistant_message: 'Committed as 3e4931e on main\n\nMore details here',
    });
    assert.strictEqual(body, 'Committed as 3e4931e on main');
  });

  it('truncates long last_assistant_message at 100 chars', () => {
    const long = 'A'.repeat(120);
    const body = buildBody('completion', { last_assistant_message: long });
    assert.strictEqual(body, 'A'.repeat(100) + '...');
  });
});
