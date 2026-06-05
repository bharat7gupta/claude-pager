# claude-pager

Native desktop notifications for Claude Code. Get alerted when a session needs your attention — permission prompts, idle waits, or task completion.

## Install

```bash
claude plugin install claude-pager
```

Or for local development:

```bash
claude --plugin-dir ./claude-pager
```

## What It Does

| Event | When | Notification |
|---|---|---|
| **Permission** | Claude needs tool approval | Shows the tool + command being requested |
| **Idle** | Claude is waiting for your input | Shows the question Claude is asking |
| **Completion** | A task finishes | "Task complete" |

Each notification shows your **project name** as the title so you know which session to switch to.

## Configuration

After install, configure via `pluginConfigs` in `~/.claude/settings.json`:

```json
{
  "pluginConfigs": {
    "claude-pager": {
      "options": {
        "idle_enabled": "on",
        "permission_enabled": "on",
        "completion_enabled": "on",
        "idle_sound": "default",
        "permission_sound": "default",
        "completion_sound": "default"
      }
    }
  }
}
```

### Toggle Events

Set any `*_enabled` to `"off"` to disable that notification type.

### Sound Presets

| Preset | Description |
|---|---|
| `default` | Per-event default (idle=hero, permission=ping, completion=glass) |
| `ping` | Subtle ping |
| `glass` | Satisfying ding |
| `pop` | Quick pop |
| `hero` | Attention-grabbing |
| `none` | Silent — visual notification only |

## Platform Support

| Platform | Notification | Sound | Notes |
|---|---|---|---|
| **macOS** | `terminal-notifier` or `osascript` | `afplay` | Works out of the box. `brew install terminal-notifier` for clickable notifications |
| **Linux** | `notify-send` | `paplay` / `aplay` | Requires `libnotify` package |
| **Windows** | PowerShell NotifyIcon balloon | PowerShell SystemSounds | Optional: install `BurntToast` module for modern toasts |

### Headless / SSH

When no desktop is available, falls back to a stdout line + terminal bell. No errors.

## Requirements

- Claude Code v2.1.0+
- Node.js (ships with Claude Code)
- Linux: `libnotify` / `notify-send` for desktop notifications

## License

MIT
