'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ChatSessionInfo {
  id: string;
  telegramUserId: string;
  createdAt: number;
  updatedAt: number;
  user: {
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
  messageCount: number;
}

export function ChatLogsSessionsList() {
  const router = useRouter();
  const { t } = useLanguage();
  const [allSessions, setAllSessions] = useState<ChatSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    dateFrom: '',
    dateTo: '',
  });

  // Load all sessions
  const loadAllSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sessions?limit=100');
      if (res.ok) {
        const { sessions } = await res.json();
        setAllSessions(sessions);
      }
    } catch (error) {
      toast.error('Failed to load sessions');
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSessions();
  }, []);

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Filters for Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 {t.chatLogs.filterSessions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder={t.chatLogs.searchByUserIdName}
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            />
            <Input
              type="date"
              placeholder={t.chatLogs.fromDate}
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <Input
              type="date"
              placeholder={t.chatLogs.toDate}
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>💬 {t.chatLogs.chatSessions}</CardTitle>
          <CardDescription>
            {t.chatLogs.clickSessionToViewConversation}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground">{t.loading}</div>
          ) : (
            <div className="space-y-3">
              {allSessions
                .filter((session) => {
                  // Filter by user ID
                  if (filters.userId && !session.telegramUserId.includes(filters.userId)) {
                    return false;
                  }
                  
                  // Filter by date range
                  if (filters.dateFrom) {
                    const sessionDate = new Date(session.createdAt);
                    const fromDate = new Date(filters.dateFrom);
                    if (sessionDate < fromDate) return false;
                  }
                  
                  if (filters.dateTo) {
                    const sessionDate = new Date(session.createdAt);
                    const toDate = new Date(filters.dateTo);
                    toDate.setHours(23, 59, 59, 999); // End of day
                    if (sessionDate > toDate) return false;
                  }
                  
                  return true;
                })
                .map((session) => {
                  const userName = session.user.firstName || session.user.lastName
                    ? `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim()
                    : session.user.username || session.telegramUserId;
                  
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => router.push(`/chat-logs/${session.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{userName}</span>
                          <Badge variant="outline">
                            {session.messageCount} {t.chatLogs.messages}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {t.chatLogs.session}: {session.id.slice(0, 16)}... • {t.chatLogs.updated}: {new Date(session.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t.chatLogs.viewConversation} →
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
