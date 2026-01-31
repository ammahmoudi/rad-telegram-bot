'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface UsageCall {
  id: string;
  telegramUserId: string;
  sessionId: string | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  cost: number;
  finishReason: string | null;
  hasToolCalls: boolean;
  toolCallCount: number;
  requestDurationMs: number | null;
  createdAt: number;
  userMessage: {
    id: string;
    content: string;
    createdAt: number;
  } | null;
  assistantMessage: {
    id: string;
    content: string;
    createdAt: number;
  } | null;
}

interface UsageStats {
  totalCalls: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  totalCost: number;
}

interface UsageResponse {
  calls: UsageCall[];
  stats: UsageStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface DailyStats {
  date: string;
  cost: number;
  calls: number;
  tokens: number;
}

interface ModelStats {
  model: string;
  cost: number;
  calls: number;
  tokens: number;
}

export function UsageAccountingClient() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [calls, setCalls] = useState<UsageCall[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    telegramUserId: '',
    sessionId: '',
    model: '',
    fromDate: '',
    toDate: '',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  useEffect(() => {
    const initialUserId = searchParams.get('telegramUserId') || '';
    const initialSessionId = searchParams.get('sessionId') || '';
    const initialModel = searchParams.get('model') || '';
    setFilters((prev) => ({
      ...prev,
      telegramUserId: initialUserId,
      sessionId: initialSessionId,
      model: initialModel,
    }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }, [searchParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.telegramUserId) params.set('telegramUserId', filters.telegramUserId);
    if (filters.sessionId) params.set('sessionId', filters.sessionId);
    if (filters.model) params.set('model', filters.model);
    if (filters.fromDate) params.set('fromDate', String(new Date(filters.fromDate).getTime()));
    if (filters.toDate) params.set('toDate', String(new Date(filters.toDate).getTime()));
    params.set('limit', String(pagination.limit));
    params.set('offset', String(pagination.offset));
    return params.toString();
  }, [filters, pagination.limit, pagination.offset]);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/llm-usage?${queryString}`);
      if (!res.ok) throw new Error('Failed to load usage');
      const data: UsageResponse = await res.json();
      setCalls(data.calls || []);
      setStats(data.stats || null);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate daily stats for chart
  const dailyStats = useMemo(() => {
    const statsMap = new Map<string, DailyStats>();
    
    calls.forEach(call => {
      const date = new Date(call.createdAt).toLocaleDateString();
      const existing = statsMap.get(date) || { date, cost: 0, calls: 0, tokens: 0 };
      statsMap.set(date, {
        date,
        cost: existing.cost + call.cost,
        calls: existing.calls + 1,
        tokens: existing.tokens + call.totalTokens,
      });
    });
    
    return Array.from(statsMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [calls]);

  // Calculate model stats for breakdown
  const modelStats = useMemo(() => {
    const statsMap = new Map<string, ModelStats>();
    
    calls.forEach(call => {
      const existing = statsMap.get(call.model) || { model: call.model, cost: 0, calls: 0, tokens: 0 };
      statsMap.set(call.model, {
        model: call.model,
        cost: existing.cost + call.cost,
        calls: existing.calls + 1,
        tokens: existing.tokens + call.totalTokens,
      });
    });
    
    return Array.from(statsMap.values()).sort((a, b) => b.cost - a.cost);
  }, [calls]);

  // Calculate user stats
  const userStats = useMemo(() => {
    const statsMap = new Map<string, { userId: string; cost: number; calls: number }>();
    
    calls.forEach(call => {
      const existing = statsMap.get(call.telegramUserId) || { 
        userId: call.telegramUserId, 
        cost: 0, 
        calls: 0 
      };
      statsMap.set(call.telegramUserId, {
        userId: call.telegramUserId,
        cost: existing.cost + call.cost,
        calls: existing.calls + 1,
      });
    });
    
    return Array.from(statsMap.values()).sort((a, b) => b.cost - a.cost).slice(0, 10);
  }, [calls]);

  useEffect(() => {
    loadUsage();
  }, [queryString]);

  const handleReset = () => {
    setFilters({
      telegramUserId: '',
      sessionId: '',
      model: '',
      fromDate: '',
      toDate: '',
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-2xl">💸</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t.usage.title}</h1>
          <p className="text-sm text-slate-400">{t.usage.subtitle}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-300 mb-1">Total Project Cost</p>
                <p className="text-3xl font-bold text-white">${stats?.totalCost.toFixed(4) || '0.0000'}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-300 mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-white">{stats?.totalCalls.toLocaleString() || '0'}</p>
              </div>
              <div className="text-4xl">📞</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-300 mb-1">Total Tokens</p>
                <p className="text-3xl font-bold text-white">{stats?.totalTokens.toLocaleString() || '0'}</p>
              </div>
              <div className="text-4xl">🔢</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-300 mb-1">Cached Tokens (Savings)</p>
                <p className="text-3xl font-bold text-white">{stats?.cachedTokens.toLocaleString() || '0'}</p>
                <p className="text-xs text-yellow-200 mt-1">
                  ⚡ {stats && stats.totalTokens > 0 ? ((stats.cachedTokens / stats.totalTokens) * 100).toFixed(1) : 0}% cached
                </p>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cost Chart */}
        <Card className="bg-white/10 backdrop-blur-md border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              📊 Daily Cost Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyStats.length > 0 ? (
              <div className="space-y-2">
                {dailyStats.slice(-7).map((day, idx) => {
                  const maxCost = Math.max(...dailyStats.map(d => d.cost));
                  const width = (day.cost / maxCost) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{day.date}</span>
                        <span className="text-white font-semibold">${day.cost.toFixed(4)}</span>
                      </div>
                      <div className="h-8 bg-slate-700/30 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-end px-2 transition-all"
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-xs text-white font-medium">{day.calls} calls</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-8">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Model Breakdown */}
        <Card className="bg-white/10 backdrop-blur-md border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🤖 Cost by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modelStats.length > 0 ? (
              <div className="space-y-3">
                {modelStats.map((model, idx) => {
                  const totalCost = modelStats.reduce((sum, m) => sum + m.cost, 0);
                  const percentage = (model.cost / totalCost) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300 truncate flex-1">{model.model}</span>
                        <span className="text-white font-semibold ml-2">${model.cost.toFixed(4)}</span>
                      </div>
                      <div className="h-6 bg-slate-700/30 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-between px-2"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">{percentage.toFixed(1)}%</span>
                          <span className="text-xs text-white">{model.calls} calls</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-8">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Users by Cost */}
      {userStats.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              👥 Top Users by Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {userStats.map((user, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-4">
                  <div className="text-2xl mb-2">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}</div>
                  <div className="text-xs text-slate-400 mb-1">User ID</div>
                  <div className="text-sm text-white font-mono mb-2 truncate">{user.userId}</div>
                  <div className="text-lg font-bold text-green-400">${user.cost.toFixed(4)}</div>
                  <div className="text-xs text-slate-400">{user.calls} calls</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/10 backdrop-blur-md border border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span>🔍</span>
            {t.usage.filters}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            placeholder={t.usage.filterUserId}
            value={filters.telegramUserId}
            onChange={(e) => setFilters({ ...filters, telegramUserId: e.target.value })}
          />
          <Input
            placeholder={t.usage.filterSessionId}
            value={filters.sessionId}
            onChange={(e) => setFilters({ ...filters, sessionId: e.target.value })}
          />
          <Input
            placeholder={t.usage.filterModel}
            value={filters.model}
            onChange={(e) => setFilters({ ...filters, model: e.target.value })}
          />
          <Input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
          />
          <Input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
          />
          <div className="flex gap-2 lg:col-span-5">
            <Button variant="secondary" onClick={handleReset}>
              {t.usage.resetFilters}
            </Button>
            <div className="text-xs text-slate-400 flex items-center">
              {t.usage.totalRecords}: {pagination.total}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border border-white/20">
        <CardHeader>
          <CardTitle className="text-white">{t.usage.recentCalls}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-slate-400">{t.loading}</div>
          ) : calls.length === 0 ? (
            <div className="text-slate-400">{t.usage.noCalls}</div>
          ) : (
            <div className="space-y-4">
              {calls.map((call) => (
                <div 
                  key={call.id} 
                  className="border border-white/20 rounded-lg p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {new Date(call.createdAt).toLocaleString()}
                      </Badge>
                      <span className="text-xs text-slate-400">👤 User: {call.telegramUserId}</span>
                      {call.sessionId && (
                        <a 
                          href={`/chat-logs/${call.sessionId}`} 
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📋 View Session
                        </a>
                      )}
                      <Badge variant="outline" className="text-xs">{call.model}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-400">💸 ${call.cost.toFixed(6)}</span>
                      <span className="text-xs text-slate-400">{expandedCall === call.id ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {/* User Message */}
                  {call.userMessage && (
                    <div className="mb-3 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                      <div className="text-xs font-semibold text-blue-300 mb-1.5 flex items-center gap-2">
                        <span>👤 User Question</span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(call.userMessage.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                        {call.userMessage.content.length > 300 && expandedCall !== call.id 
                          ? call.userMessage.content.substring(0, 300) + '...' 
                          : call.userMessage.content}
                      </div>
                    </div>
                  )}

                  {/* Assistant Message */}
                  {call.assistantMessage && (
                    <div className="mb-3 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                      <div className="text-xs font-semibold text-green-300 mb-1.5 flex items-center gap-2">
                        <span>🤖 AI Response</span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(call.assistantMessage.createdAt).toLocaleTimeString()}
                        </span>
                        <span className="ml-auto text-green-400 font-bold">
                          💸 ${call.cost.toFixed(6)}
                        </span>
                      </div>
                      <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                        {call.assistantMessage.content.length > 300 && expandedCall !== call.id
                          ? call.assistantMessage.content.substring(0, 300) + '...'
                          : call.assistantMessage.content}
                      </div>
                    </div>
                  )}

                  {/* Compact Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span>🔢 {call.totalTokens.toLocaleString()} tokens</span>
                    {call.cachedTokens > 0 && (
                      <span className="text-green-400">⚡ {call.cachedTokens.toLocaleString()} cached</span>
                    )}
                    {call.hasToolCalls && (
                      <Badge variant="secondary" className="text-xs">🔧 {call.toolCallCount} tools</Badge>
                    )}
                    {call.requestDurationMs && (
                      <span>⏱️ {call.requestDurationMs}ms</span>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedCall === call.id && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Prompt Tokens</div>
                          <div className="font-semibold text-white">{call.promptTokens.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Completion Tokens</div>
                          <div className="font-semibold text-white">{call.completionTokens.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Total Tokens</div>
                          <div className="font-semibold text-white">{call.totalTokens.toLocaleString()}</div>
                        </div>
                        {call.cachedTokens > 0 && (
                          <div>
                            <div className="text-green-400 text-xs mb-1">⚡ Cached Tokens</div>
                            <div className="font-semibold text-green-400">{call.cachedTokens.toLocaleString()}</div>
                            <div className="text-xs text-slate-400">
                              Saved ${((call.cachedTokens / call.totalTokens) * call.cost).toFixed(6)}
                            </div>
                          </div>
                        )}
                        {call.cacheWriteTokens > 0 && (
                          <div>
                            <div className="text-slate-400 text-xs mb-1">💾 Cache Write</div>
                            <div className="font-semibold text-white">{call.cacheWriteTokens.toLocaleString()}</div>
                          </div>
                        )}
                        {call.reasoningTokens > 0 && (
                          <div>
                            <div className="text-purple-400 text-xs mb-1">🧠 Reasoning</div>
                            <div className="font-semibold text-purple-400">{call.reasoningTokens.toLocaleString()}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Finish Reason</div>
                          <div className="font-semibold text-white">{call.finishReason || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">💸 Cost</div>
                          <div className="font-semibold text-lg text-white">${call.cost.toFixed(6)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              disabled={pagination.offset === 0}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  offset: Math.max(prev.offset - prev.limit, 0),
                }))
              }
            >
              {t.usage.prev}
            </Button>
            <div className="text-xs text-slate-400">
              {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} / {pagination.total}
            </div>
            <Button
              variant="outline"
              disabled={!pagination.hasMore}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  offset: prev.offset + prev.limit,
                }))
              }
            >
              {t.usage.next}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, suffix = '' }: { title: string; value: string | number; suffix?: string }) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border border-white/20">
      <CardContent className="p-4">
        <div className="text-xs text-slate-400">{title}</div>
        <div className="text-2xl font-bold text-white">
          {value}
          {suffix}
        </div>
      </CardContent>
    </Card>
  );
}
