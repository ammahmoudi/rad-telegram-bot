'use client';

import { useState, useEffect } from 'react';
import { ReCron } from '@sbzen/re-cron';
import { useLanguage } from '@/contexts/LanguageContext';

// Validate cron expression format
function isValidCronFormat(expression: string): boolean {
  try {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 6) {
      return false;
    }
    
    // Basic validation for each part
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // Validate minute (0-59)
    if (!isValidCronPart(minute, 0, 59)) return false;
    // Validate hour (0-23)
    if (!isValidCronPart(hour, 0, 23)) return false;
    // Validate day of month (1-31)
    if (!isValidCronPart(dayOfMonth, 1, 31)) return false;
    // Validate month (1-12)
    if (!isValidCronPart(month, 1, 12)) return false;
    // Validate day of week (0-7, where 0 and 7 are Sunday)
    if (!isValidCronPart(dayOfWeek, 0, 7)) return false;
    
    return true;
  } catch {
    return false;
  }
}

function isValidCronPart(part: string, min: number, max: number): boolean {
  // Allow wildcards
  if (part === '*') return true;
  
  // Allow step values (*/5)
  if (part.startsWith('*/')) {
    const step = parseInt(part.slice(2));
    return !isNaN(step) && step > 0;
  }
  
  // Allow ranges (1-5)
  if (part.includes('-')) {
    const [start, end] = part.split('-').map(Number);
    return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end;
  }
  
  // Allow lists (1,3,5)
  if (part.includes(',')) {
    return part.split(',').every(p => {
      const num = parseInt(p);
      return !isNaN(num) && num >= min && num <= max;
    });
  }
  
  // Single value
  const num = parseInt(part);
  return !isNaN(num) && num >= min && num <= max;
}

interface CronSchedulerProps {
  value: string;
  onChange: (value: string) => void;
  timezone?: string;
}

interface Preset {
  label: string;
  value: string;
  description: string;
}

const PRESETS: Preset[] = [
  { label: 'Every day at 9 AM', value: '0 9 * * *', description: 'Daily at 09:00' },
  { label: 'Every day at 10 PM', value: '0 22 * * *', description: 'Daily at 22:00' },
  { label: 'Every weekday at 9 AM', value: '0 9 * * 1-5', description: 'Mon-Fri at 09:00' },
  { label: 'Every Monday at 9 AM', value: '0 9 * * 1', description: 'Weekly on Monday' },
  { label: 'Every hour', value: '0 * * * *', description: 'Hourly on the hour' },
  { label: 'Every 30 minutes', value: '*/30 * * * *', description: 'Twice per hour' },
  { label: 'First day of month at 9 AM', value: '0 9 1 * *', description: 'Monthly on the 1st' },
];

export function CronScheduler({ value, onChange, timezone = 'Asia/Tehran' }: CronSchedulerProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [customCron, setCustomCron] = useState(value);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate current cron expression
  useEffect(() => {
    if (customCron && !isValidCronFormat(customCron)) {
      setValidationError('Invalid cron expression format');
    } else {
      setValidationError(null);
    }
  }, [customCron]);

  const handlePresetSelect = (preset: string) => {
    onChange(preset);
    setCustomCron(preset);
    setValidationError(null);
  };

  const handleCronChange = (cronExpression: string) => {
    setCustomCron(cronExpression);
    if (isValidCronFormat(cronExpression)) {
      onChange(cronExpression);
      setValidationError(null);
    } else {
      setValidationError('Invalid cron expression format');
    }
  };

  const selectedPreset = PRESETS.find((p) => p.value === value);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setMode('simple')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            mode === 'simple'
              ? 'bg-blue-600 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          {t.jobs?.cron?.simple || 'Simple'}
        </button>
        <button
          type="button"
          onClick={() => setMode('advanced')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            mode === 'advanced'
              ? 'bg-blue-600 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          {t.jobs?.cron?.advanced || 'Advanced'}
        </button>
        <span className="text-sm text-slate-400 ml-auto">
          {t.jobs?.timezone || 'Timezone'}: {timezone}
        </span>
      </div>

      {mode === 'simple' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-2">{t.jobs?.cron?.presetLabel || 'Choose a preset schedule:'}</label>
            <select
              value={value}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            >
              {PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label} - {preset.description} ({preset.value})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mt-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
            <div className="text-sm text-blue-300 mb-1">{t.jobs?.cron?.currentSchedule || 'Current Schedule'}:</div>
            <div className="font-mono text-white text-lg">{value}</div>
            {selectedPreset && (
              <div className="text-sm text-blue-400 mt-1">{selectedPreset.description}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-slate-400 mb-2">
            {t.jobs?.cron?.advancedLabel || 'Build your custom cron expression using the visual editor or enter it manually:'}
          </div>
          
          <div className="bg-slate-900/60 border border-white/10 rounded-lg p-6">
            <div className="cron-builder-wrapper">
              <ReCron
                value={customCron}
                onChange={handleCronChange}
                cssClassPrefix=""
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">{t.jobs?.cron?.manualLabel || 'Or enter manually:'}</label>
            <input
              type="text"
              value={customCron}
              onChange={(e) => handleCronChange(e.target.value)}
              placeholder={t.jobs?.cron?.placeholder || 'e.g., 0 9 * * 1-5 (weekdays at 9 AM)'}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          
          {validationError ? (
            <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-sm text-red-300 font-medium mb-1">{t.jobs?.cron?.validationError || 'Validation Error'}:</div>
                  <div className="text-sm text-red-200">{validationError}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
              <div className="text-sm text-blue-300 font-medium mb-1">{t.jobs?.cron?.generatedLabel || 'Generated Cron Expression'}:</div>
              <div className="font-mono text-white text-lg">{customCron}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
