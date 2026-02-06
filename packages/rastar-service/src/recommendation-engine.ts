/**
 * Food Recommendation Engine
 * AI-powered food recommendations based on user history and preferences
 */

import type { FoodItem, FoodRecommendation, UserFoodPreferences, DailyFoodOption } from './types.js';
import { formatDateForLocale, getAppTimezone } from '@rad/shared';

/**
 * Analyze user's selection history to find patterns
 */
export function analyzeSelectionHistory(
  history: Array<{ date: string; foodName: string }>
): {
  favoriteFoods: string[];
  frequencyMap: Map<string, number>;
  averageSelectionsPerWeek: number;
} {
  const frequencyMap = new Map<string, number>();
  
  for (const item of history) {
    const count = frequencyMap.get(item.foodName) ?? 0;
    frequencyMap.set(item.foodName, count + 1);
  }

  // Sort by frequency to get favorites
  const sorted = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const favoriteFoods = sorted.slice(0, 5).map(([name]) => name);

  // Calculate average per week (assuming history spans some weeks)
  const dates = new Set(history.map(h => h.date));
  const weeks = Math.max(1, Math.ceil(dates.size / 7));
  const averageSelectionsPerWeek = history.length / weeks;

  return {
    favoriteFoods,
    frequencyMap,
    averageSelectionsPerWeek,
  };
}

/**
 * Generate food recommendations for unselected days
 * Uses simple heuristics - can be enhanced with AI later
 */
export function generateRecommendations(
  unselectedDays: DailyFoodOption[],
  preferences?: UserFoodPreferences,
  history?: Array<{ date: string; foodName: string }>
): FoodRecommendation[] {
  const recommendations: FoodRecommendation[] = [];
  
  // Group by date
  const byDate = new Map<string, DailyFoodOption[]>();
  for (const opt of unselectedDays) {
    const dateOpts = byDate.get(opt.date) ?? [];
    dateOpts.push(opt);
    byDate.set(opt.date, dateOpts);
  }

  // Analyze history if available
  let favoriteFoods: string[] = [];
  if (history && history.length > 0) {
    const analysis = analyzeSelectionHistory(history);
    favoriteFoods = analysis.favoriteFoods;
  }

  // Generate recommendation for each date
  for (const [date, options] of byDate.entries()) {
    if (options.length === 0) continue;

    let recommendedOption = options[0];
    let reason = 'گزینه اول در دسترس';
    let confidence = 0.5;

    // Check if any option matches favorites
    if (favoriteFoods.length > 0) {
      for (const opt of options) {
        if (favoriteFoods.includes(opt.food.name)) {
          recommendedOption = opt;
          reason = `بر اساس تاریخچه انتخاب‌های شما - شما قبلاً این غذا رو دوست داشتید`;
          confidence = 0.8;
          break;
        }
      }
    }

    // Check preferences if available
    if (preferences?.preferredFoods) {
      for (const opt of options) {
        if (preferences.preferredFoods.some(pf => 
          opt.food.name.toLowerCase().includes(pf.toLowerCase())
        )) {
          recommendedOption = opt;
          reason = 'مطابق با ترجیحات شما';
          confidence = 0.9;
          break;
        }
      }
    }

    // Check avoid list
    if (preferences?.avoidFoods) {
      const avoidSet = new Set(preferences.avoidFoods.map(f => f.toLowerCase()));
      const filtered = options.filter(opt => 
        !avoidSet.has(opt.food.name.toLowerCase())
      );
      if (filtered.length > 0 && filtered[0] !== recommendedOption) {
        recommendedOption = filtered[0];
        reason = 'با حذف غذاهایی که نمی‌خواید';
        confidence = Math.min(confidence, 0.7);
      }
    }

    const alternatives = options
      .filter(opt => opt.scheduleId !== recommendedOption.scheduleId)
      .map(opt => opt.food);

    recommendations.push({
      date,
      recommendedFood: recommendedOption.food,
      reason,
      confidence,
      alternatives,
    });
  }

  return recommendations;
}

/**
 * Format recommendations as a message for the user
 */
export function formatRecommendationsMessage(
  recommendations: FoodRecommendation[],
  language: 'fa' | 'en' = 'fa'
): string {
  if (recommendations.length === 0) {
    return language === 'fa' 
      ? '✅ همه روزها انتخاب شده!'
      : '✅ All days are selected!';
  }

  const lines: string[] = [];
  
  if (language === 'fa') {
    lines.push('🍽️ **پیشنهاد غذا برای روزهای انتخاب نشده:**\n');
  } else {
    lines.push('🍽️ **Food recommendations for unselected days:**\n');
  }

  for (const rec of recommendations) {
    const dateFormatted = formatDateForLocale(
      rec.date,
      language === 'fa' ? 'fa-IR' : 'en-US',
      getAppTimezone(),
      { weekday: 'long', month: 'short', day: 'numeric' }
    );

    lines.push(`📅 **${dateFormatted}**`);
    lines.push(`   ➤ ${rec.recommendedFood.name}`);
    lines.push(`   💡 ${rec.reason}`);
    
    if (rec.alternatives.length > 0) {
      const altNames = rec.alternatives.map(a => a.name).join('، ');
      lines.push(language === 'fa' 
        ? `   🔄 گزینه‌های دیگر: ${altNames}`
        : `   🔄 Alternatives: ${altNames}`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Create AI prompt for generating personalized recommendations
 * This can be used with OpenAI/Claude for more sophisticated recommendations
 */
export function createRecommendationPrompt(
  unselectedDays: DailyFoodOption[],
  userHistory: Array<{ date: string; foodName: string }>,
  preferences?: UserFoodPreferences
): string {
  const historyStr = userHistory.length > 0
    ? userHistory.slice(-20).map(h => `${h.date}: ${h.foodName}`).join('\n')
    : 'No history available';

  const prefsStr = preferences
    ? JSON.stringify(preferences, null, 2)
    : 'No preferences set';

  const optionsStr = unselectedDays
    .map(d => `${d.date}: ${d.food.name}`)
    .join('\n');

  return `
You are a food recommendation assistant for a workplace cafeteria system.

USER'S RECENT FOOD SELECTIONS:
${historyStr}

USER PREFERENCES:
${prefsStr}

AVAILABLE OPTIONS FOR UNSELECTED DAYS:
${optionsStr}

Please recommend the best food option for each unselected day based on:
1. User's past preferences and selection patterns
2. Variety (avoid suggesting same food multiple days in a row)
3. Any dietary restrictions or preferences

Respond in Persian (فارسی) with:
- The recommended food for each date
- A brief reason why
- Alternative options if the user wants something different

Be friendly and conversational!
`.trim();
}
