'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ChatSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
}

interface Pack {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

interface UserDetailClientProps {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    role: string;
    lastSeenAt: Date | bigint | null;
    createdAt: Date | bigint | null;
  };
  currentPack?: Pack | null;
  availablePacks: Pack[];
  hasPlankaConnection: boolean;
  hasRastarConnection: boolean;
}

export function UserDetailClient({
  user,
  currentPack,
  availablePacks,
  hasPlankaConnection,
  hasRastarConnection,
}: UserDetailClientProps) {
  const { t } = useLanguage();
  const [selectedPackId, setSelectedPackId] = useState<string>(currentPack?.id || '');
  const [loading, setLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    loadChatSessions();
  }, [user.id]);

  const loadChatSessions = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setChatSessions(data);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleUpdatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${user.id}/pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: selectedPackId || null }),
      });

      if (res.ok) {
        toast.success(`✓ ${t.users.packUpdated}`);
      } else {
        toast.error(t.error);
      }
    } catch (error) {
      console.error(error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.firstName || user.lastName
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : user.username || `User ${user.id.slice(0, 8)}`;

  const roleConfig = {
    admin: { label: 'Admin', color: 'from-red-500 to-rose-500' },
    manager: { label: 'Manager', color: 'from-blue-500 to-cyan-500' },
    user: { label: 'User', color: 'from-slate-500 to-slate-600' },
  };

  const roleInfo = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/users"
          className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 mb-4"
        >
          {t.users.backToUsers}
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {(user.firstName || user.username || 'U')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{displayName}</h1>
            {user.username && (
              <p className="text-slate-400">@{user.username}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            {t.users.accountInfo}
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">{t.users.role}</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold text-white bg-linear-to-r ${roleInfo.color}`}>
                {t.users.roles[user.role as keyof typeof t.users.roles] || roleInfo.label}
              </span>
            </div>

            <div>
              <p className="text-sm text-slate-400">{t.users.telegramId}</p>
              <p className="text-white font-mono">{user.id}</p>
            </div>

            <div>
              <p className="text-sm text-slate-400">{t.users.lastActivity}</p>
              <p className="text-white">
                {user.lastSeenAt
                  ? new Date(Number(user.lastSeenAt)).toLocaleString()
                  : 'Never'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">{t.users.memberSince}</p>
              <p className="text-white">
                {user.createdAt
                  ? new Date(Number(user.createdAt)).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Connections Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            {t.users.connections}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">{t.users.planka}</span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                  hasPlankaConnection
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}
              >
                {hasPlankaConnection ? '✓ ' + t.users.connected : '✗ ' + t.users.notConnected}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">{t.users.rastar}</span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                  hasRastarConnection
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}
              >
                {hasRastarConnection ? '✓ ' + t.users.connected : '✗ ' + t.users.notConnected}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pack Assignment Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🎭</span>
          {t.users.assignPack}
        </h2>

        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">{t.users.currentPack}</p>
          <p className="text-white font-medium">
            {currentPack ? currentPack.name : t.users.defaultPack}
          </p>
          {currentPack?.description && (
            <p className="text-sm text-slate-400 mt-1">{currentPack.description}</p>
          )}
        </div>

        <form onSubmit={handleUpdatePack} className="space-y-4">
          <div>
            <label htmlFor="packId" className="block text-sm font-semibold text-slate-200 mb-2">
              {t.users.selectPack}
            </label>
            <select
              id="packId"
              value={selectedPackId}
              onChange={(e) => setSelectedPackId(e.target.value)}
              className="w-full px-4 py-2 border border-white/10 bg-white/5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">{t.users.defaultPack}</option>
              {availablePacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name} {pack.isDefault ? '⭐' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2">
              {t.users.removePack}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.loading}
              </>
            ) : (
              t.users.updatePack
            )}
          </button>
        </form>
      </div>

      {/* Chat Sessions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            {t.users.chatSessions || 'Chat Sessions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div className="text-center py-8 text-muted-foreground">{t.loading}</div>
          ) : chatSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.users.noChats || 'No chat sessions found'}
            </div>
          ) : (
            <div className="space-y-3">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {session._count.messages} {t.users.messages || 'messages'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(session.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t.users.lastActivity || 'Last activity'}: {new Date(session.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                  >
                    <Link href={`/tool-logs?sessionId=${session.id}`}>
                      {t.users.viewChat || 'View Chat'}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
