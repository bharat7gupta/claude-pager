// scripts/config.mjs

const DEFAULTS = {
  idle: { enabled: true, sound: 'default' },
  permission: { enabled: true, sound: 'default' },
  completion: { enabled: true, sound: 'default' },
};

const EVENT_TYPES = ['idle', 'permission', 'completion'];

export function loadConfig() {
  const config = {};

  for (const type of EVENT_TYPES) {
    const enabledRaw = process.env[`CLAUDE_PLUGIN_OPTION_${type}_enabled`];
    const soundRaw = process.env[`CLAUDE_PLUGIN_OPTION_${type}_sound`];

    config[type] = {
      enabled: enabledRaw === 'off' ? false : DEFAULTS[type].enabled,
      sound: soundRaw || DEFAULTS[type].sound,
    };
  }

  return config;
}
