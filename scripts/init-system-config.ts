/**
 * Initialize system config from environment variables
 * This should run on startup to set default values from .env
 */
import { setSystemConfig, getSystemConfig } from '@rad/shared';

async function initSystemConfig() {
  console.log('[init-system-config] Initializing system configuration from environment variables...');

  // List of env variables to sync to system config
  const envMappings: Array<{ envKey: string; configKey: string; defaultValue?: string }> = [
    { envKey: 'PLANKA_SERVER_URL', configKey: 'PLANKA_BASE_URL' },
    { envKey: 'OPENROUTER_API_KEY', configKey: 'OPENROUTER_API_KEY' },
    { envKey: 'DEFAULT_AI_MODEL', configKey: 'DEFAULT_AI_MODEL', defaultValue: 'anthropic/claude-3.5-sonnet' },
    { envKey: 'PLANKA_DAILY_REPORT_CATEGORY_ID', configKey: 'PLANKA_DAILY_REPORT_CATEGORY_ID' },
  ];

  for (const { envKey, configKey, defaultValue } of envMappings) {
    try {
      // Check if config already exists (user may have set via admin panel)
      const existingValue = await getSystemConfig(configKey);
      
      if (existingValue) {
        console.log(`[init-system-config] ✓ ${configKey} already set in database (user override)`);
        continue;
      }

      // Get value from env or use default
      const envValue = process.env[envKey] || defaultValue;
      
      if (envValue) {
        await setSystemConfig(configKey, envValue);
        console.log(`[init-system-config] ✓ Set ${configKey} from ${envKey}`);
      } else {
        console.log(`[init-system-config] ⊘ ${configKey} not set (no env variable or default)`);
      }
    } catch (error) {
      console.error(`[init-system-config] ✗ Error setting ${configKey}:`, error);
    }
  }

  console.log('[init-system-config] System configuration initialization complete');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initSystemConfig()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[init-system-config] Fatal error:', error);
      process.exit(1);
    });
}

export { initSystemConfig };
