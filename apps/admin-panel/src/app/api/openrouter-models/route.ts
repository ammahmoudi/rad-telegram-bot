import { NextResponse } from 'next/server';
import { fetchOpenRouterModels, sortModelsByPrice, getRecommendedModels } from '@rad/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = await fetchOpenRouterModels();
    const sortedModels = sortModelsByPrice(models);
    const recommended = getRecommendedModels();

    return NextResponse.json({
      models: sortedModels,
      recommended,
      total: sortedModels.length,
    });
  } catch (error) {
    console.error('Failed to fetch OpenRouter models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
