// scripts/sounds.mjs
import { spawn } from 'node:child_process';

const EVENT_DEFAULTS = {
  idle: 'blow',
  permission: 'funk',
  completion: 'glass',
};

const MACOS_SOUNDS = {
  blow: 'Blow.aiff',
  funk: 'Funk.aiff',
  glass: 'Glass.aiff',
  ping: 'Ping.aiff',
  pop: 'Pop.aiff',
  hero: 'Hero.aiff',
};

const LINUX_SOUNDS = {
  blow: 'dialog-warning.oga',
  funk: 'bell.oga',
  glass: 'dialog-information.oga',
  ping: 'bell.oga',
  pop: 'message-new-instant.oga',
  hero: 'complete.oga',
};

const WINDOWS_SOUNDS = {
  blow: 'Question',
  funk: 'Exclamation',
  glass: 'Asterisk',
  ping: 'Beep',
  pop: 'Exclamation',
  hero: 'Hand',
};

export function resolveSound(preset, eventType) {
  if (preset === 'default') return EVENT_DEFAULTS[eventType];
  return preset;
}

export function buildSoundCommand(preset, platform) {
  if (preset === 'none') return null;

  if (platform === 'darwin') {
    const file = MACOS_SOUNDS[preset];
    if (!file) return null;
    return { command: 'afplay', args: [`/System/Library/Sounds/${file}`] };
  }

  if (platform === 'linux') {
    const file = LINUX_SOUNDS[preset];
    if (!file) return null;
    const path = `/usr/share/sounds/freedesktop/stereo/${file}`;
    return {
      command: 'paplay',
      args: [path],
      fallback: { command: 'aplay', args: [path] },
    };
  }

  if (platform === 'win32') {
    const name = WINDOWS_SOUNDS[preset];
    if (!name) return null;
    return {
      command: 'powershell',
      args: ['-NoProfile', '-Command', `[System.Media.SystemSounds]::${name}.Play()`],
    };
  }

  return null;
}

export function playSound(preset, platform) {
  const cmd = buildSoundCommand(preset, platform);
  if (!cmd) return;

  try {
    const child = spawn(cmd.command, cmd.args, {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    child.on('error', () => {
      if (cmd.fallback) {
        const fb = spawn(cmd.fallback.command, cmd.fallback.args, {
          detached: true,
          stdio: 'ignore',
        });
        fb.unref();
        fb.on('error', () => {});
      }
    });
  } catch {
    // Sound failure is non-fatal
  }
}
