/**
 * Rastar Food Service Types
 */

export interface FoodItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

export interface DailyFoodOption {
  scheduleId: string;
  date: string;
  food: FoodItem;
  isSelected: boolean;
  selectionId?: string;
}

export interface UserFoodStatus {
  userId: string;
  telegramUserId: string;
  email: string;
  unselectedDays: DailyFoodOption[];
  upcomingUnselectedCount: number;
  totalAvailableDays: number;
  selectionRate: number;
}

export interface FoodRecommendation {
  date: string;
  recommendedFood: FoodItem;
  reason: string;
  confidence: number;
  alternatives: FoodItem[];
}

export interface UserFoodPreferences {
  telegramUserId: string;
  favoriteCategories?: string[];
  avoidCategories?: string[];
  preferredFoods?: string[];
  avoidFoods?: string[];
  dietaryRestrictions?: string[];
}

export interface SelectionHistory {
  date: string;
  food: FoodItem;
  selectedAt: number;
}

export interface RastarApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
