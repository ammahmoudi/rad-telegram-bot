'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { Tool, ToolHeader, ToolContent } from '@/components/ai-elements/tool';
import { JsonViewer } from '@/components/JsonViewer';

interface McpToolLog {
  id: string;
  timestamp: Date;
  server: string;
  tool: string;
  userId: string | null;
  sessionId: string | null;
  messageId: string | null;
  inputJson: string;
  outputJson: string | null;
  error: string | null;
  success: boolean;
  durationMs: number | null;
}

interface SessionMessage {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  toolCalls: McpToolLog[];
  toolCallId?: string | null;
  toolName?: string | null;
  toolArgs?: string | null;
  replyToMessageId?: number | null;
  threadId?: number | null;
  telegramMessageId?: number | null;
}

interface SessionUser {
  telegramUserId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

interface ChatSessionViewProps {
  sessionId: string;
}

export function ChatSessionView({ sessionId }: ChatSessionViewProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedButton, setSelectedButton] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<McpToolLog | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    mcpServer: '',
  });

  // Parse buttons from message content
  const parseMessageContent = (content: string) => {
    const buttonRegex = /###BUTTONS_START###(.+?)###BUTTONS_END###/s;
    const match = content.match(buttonRegex);
    
    if (!match) {
      return { text: content, buttons: null };
    }
    
    try {
      const buttonsJson = match[1].replace(/&quot;/g, '"');
      const buttons = JSON.parse(buttonsJson);
      const text = content.replace(buttonRegex, '').trim();
      return { text, buttons };
    } catch (e) {
      console.error('Failed to parse buttons:', e);
      return { text: content, buttons: null };
    }
  };

  // Load session messages
  const loadSessionMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/session-messages?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      
      const { messages: data, session: userData } = await res.json();
      
      // Set user data if available
      if (userData) {
        setSessionUser(userData);
      }
      
      // Transform the data structure to match SessionMessage interface
      const transformedMessages = data.map((item: any) => {
        const transformed = {
          id: item.message.id,
          timestamp: new Date(item.message.createdAt),
          role: item.message.role,
          content: item.message.content,
          replyToMessageId: item.message.replyToMessageId,
          threadId: item.message.threadId,
          telegramMessageId: item.message.telegramMessageId,
          toolCalls: item.toolCalls.map((tc: any) => ({
            id: tc.id,
            timestamp: new Date(tc.createdAt),
            server: tc.mcpServer,
            tool: tc.toolName,
            userId: tc.telegramUserId,
            sessionId: tc.sessionId,
            messageId: tc.messageId,
            inputJson: JSON.stringify(tc.inputArgs),
            outputJson: tc.outputContent ? JSON.stringify(tc.outputContent) : null,
            error: tc.errorMessage,
            success: tc.success,
            durationMs: tc.executionTimeMs,
          })),
        };
        return transformed;
      });
      
      setSessionMessages(transformedMessages);
    } catch (error) {
      toast.error('Failed to load session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch session/user data from sessions API
  const loadSessionUser = async () => {
    try {
      const res = await fetch(`/api/sessions?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      
      const { session } = await res.json();
      if (session) {
        setSessionUser({
          telegramUserId: session.telegramUserId,
          firstName: session.user?.firstName || null,
          lastName: session.user?.lastName || null,
          username: session.user?.username || null,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messageCount,
        });
      }
    } catch (error) {
      console.error('Failed to load session user:', error);
    }
  };

  useEffect(() => {
    loadSessionMessages();
    loadSessionUser();
  }, [sessionId]);

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          ← {t.chatLogs.backToAllSessions}
        </Button>
      </div>

      {/* User Details Card */}
      {sessionUser && (
        <Card className="bg-linear-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  👤 {sessionUser.firstName || sessionUser.lastName 
                    ? `${sessionUser.firstName || ''} ${sessionUser.lastName || ''}`.trim()
                    : sessionUser.username || sessionUser.telegramUserId}
                </CardTitle>
                <CardDescription className="mt-2">
                  {sessionUser.username && `@${sessionUser.username} • `}
                  ID: {sessionUser.telegramUserId}
                </CardDescription>
              </div>
              <Link href={`/users/${sessionUser.telegramUserId}`}>
                <Button variant="default" size="sm">
                  📋 {t.chatLogs.viewFullProfile} →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">{t.chatLogs.messagesInSession}</div>
                <div className="text-lg font-bold">{sessionUser.messageCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t.chatLogs.sessionCreated}</div>
                <div className="text-sm">{new Date(sessionUser.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t.chatLogs.lastActivity}</div>
                <div className="text-sm">{new Date(sessionUser.updatedAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t.chatLogs.sessionIdLabel}</div>
                <div className="text-xs font-mono truncate">{sessionId.slice(0, 12)}...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat View with AI Elements */}
      <Card className="flex flex-col h-[calc(100vh-12rem)]">
        <CardHeader>
          <CardTitle>💬 {t.chatLogs.conversation}</CardTitle>
          <CardDescription>
            {t.chatLogs.session}: {sessionId.substring(0, 16)}...
          </CardDescription>
          
          {/* Conversation Filters */}
          <div className="grid gap-2 grid-cols-2 mt-4 pt-4 border-t">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{t.chatLogs.roleLabel}</label>
              <select
                aria-label="Filter by role"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">{t.chatLogs.allRoles}</option>
                <option value="user">{t.chatLogs.roleUser}</option>
                <option value="assistant">{t.chatLogs.roleAssistant}</option>
                <option value="system">{t.chatLogs.roleSystem}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{t.chatLogs.mcpServerLabel}</label>
              <select
                aria-label="Filter by MCP server"
                value={filters.mcpServer}
                onChange={(e) => setFilters({ ...filters, mcpServer: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">{t.chatLogs.allServers}</option>
                <option value="planka">Planka</option>
                <option value="rastar">Rastar</option>
                <option value="time">Time</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <Conversation className="h-full">
            <ConversationContent>
              {loading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t.loading}
                </div>
              ) : sessionMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t.chatLogs.noMessagesInSession}
                </div>
              ) : (
                sessionMessages
                  .filter((msg) => {
                    // Filter by role
                    if (filters.role && msg.role !== filters.role) return false;
                    
                    // Filter by MCP server (check tool calls)
                    if (filters.mcpServer) {
                      const hasMcpServer = msg.toolCalls.some(
                        (tc) => tc.server === filters.mcpServer
                      );
                      if (!hasMcpServer) return false;
                    }
                    
                    return true;
                  })
                  .map((msg, idx, arr) => {
                    const { text, buttons } = parseMessageContent(msg.content || '');
                    const isUser = msg.role === 'user';
                    
                    // Skip rendering empty assistant messages with only tool calls
                    const isEmptyAssistantWithTools = msg.role === 'assistant' && !text && msg.toolCalls.length > 0;
                    
                    // Find replied message if exists
                    let repliedMessage = null;
                    if (msg.replyToMessageId) {
                      repliedMessage = arr.find(m => m.telegramMessageId === msg.replyToMessageId);
                    }
                    
                    return (
                      <div key={msg.id} className={`mb-6 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                          {/* Reply Context */}
                          {repliedMessage && (
                            <div className="mb-2 px-3 py-2 rounded-lg border-l-4 border-blue-500 bg-blue-500/10 text-xs max-w-full">
                              <div className="font-semibold text-blue-400 mb-1">
                                ↩️ {t.chatLogs.replyingTo} {repliedMessage.role === 'user' ? t.chatLogs.roleUser : t.chatLogs.roleAssistant}:
                              </div>
                              <div className="text-muted-foreground line-clamp-2 wrap-break-word">
                                {repliedMessage.content ? parseMessageContent(repliedMessage.content).text : '[No content]'}
                              </div>
                            </div>
                          )}
                          
                          {/* Message bubble */}
                          {!isEmptyAssistantWithTools && (
                            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                              isUser 
                                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                : msg.role === 'assistant'
                                ? 'bg-muted rounded-tl-sm'
                                : 'bg-muted/50 rounded-tl-sm'
                            }`}>
                            {/* Role badge for non-user messages */}
                            {!isUser && (
                              <div className="text-xs font-medium mb-2 opacity-70">
                                {msg.role === 'assistant' 
                                  ? `🤖 ${t.chatLogs.roleAssistant}` 
                                  : msg.role === 'tool' 
                                  ? `⚙️ ${t.chatLogs.roleTool}${msg.toolName ? `: ${msg.toolName}` : ''}` 
                                  : msg.role === 'system'
                                  ? `⚡ ${t.chatLogs.roleSystem}`
                                  : '💬 ' + msg.role}
                              </div>
                            )}
                            
                            {text ? (
                              <div 
                                className="whitespace-pre-wrap wrap-break-word prose prose-sm max-w-none dark:prose-invert *:my-1"
                                dangerouslySetInnerHTML={{ __html: text }}
                              />
                            ) : msg.toolCalls.length > 0 ? (
                              <div className="text-muted-foreground italic text-sm py-1">
                                [{t.chatLogs.toolExecutionSeeDetails}]
                              </div>
                            ) : (
                              <div className="text-muted-foreground/50 italic text-sm py-1">
                                [{t.chatLogs.emptyMessage}]
                              </div>
                            )}
                            
                            {/* Render buttons if present */}
                            {buttons && buttons.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {buttons.map((btn: any, idx: number) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary" 
                                    className="cursor-pointer hover:bg-secondary/80 transition-colors"
                                    onClick={() => setSelectedButton(btn)}
                                  >
                                    {btn.text}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          )}
                          
                          {/* Timestamp */}
                          {!isEmptyAssistantWithTools && (
                            <div className={`text-xs text-muted-foreground mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
                              {msg.timestamp.toLocaleString()}
                            </div>
                          )}

                          {/* Tool Calls below the message */}
                          {msg.toolCalls.length > 0 && (
                            <div className="mt-3 space-y-2 w-full">
                              {msg.toolCalls.map((toolCall) => (
                                <Tool key={toolCall.id} defaultOpen={false}>
                                  <ToolHeader
                                    title={`🔧 ${toolCall.server}.${toolCall.tool}`}
                                    type="tool-call"
                                    state={toolCall.success ? 'output-available' : 'output-error'}
                                  />
                                  <ToolContent>
                                    <div className="space-y-3 text-sm">
                                      <JsonViewer 
                                        data={toolCall.inputJson}
                                        title={t.chatLogs.inputLabel}
                                        maxHeight="16rem"
                                      />
                                      {toolCall.outputJson && (
                                        <JsonViewer 
                                          data={toolCall.outputJson}
                                          title={t.chatLogs.outputLabel}
                                          maxHeight="16rem"
                                        />
                                      )}
                                      {toolCall.error && (
                                        <div className="text-destructive">
                                          <div className="font-semibold mb-2 text-sm">❌ {t.chatLogs.errorLabel}:</div>
                                          <pre className="bg-destructive/10 p-3 rounded text-xs overflow-auto max-h-32">
                                            {toolCall.error}
                                          </pre>
                                        </div>
                                      )}
                                      <div className="flex gap-4 text-xs text-muted-foreground border-t border-muted pt-2">
                                        <span>⏱️ {t.chatLogs.durationLabel}: {toolCall.durationMs}ms</span>
                                        <span>🕐 {toolCall.timestamp.toLocaleString()}</span>
                                        <span className={toolCall.success ? 'text-green-600' : 'text-destructive'}>
                                          {toolCall.success ? `✓ ${t.chatLogs.successLabel}` : `✗ ${t.chatLogs.failedLabel}`}
                                        </span>
                                      </div>
                                    </div>
                                  </ToolContent>
                                </Tool>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </ConversationContent>
          </Conversation>
        </CardContent>
      </Card>

      {/* Button Metadata Dialog */}
      <Dialog open={!!selectedButton} onOpenChange={() => setSelectedButton(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔘 {t.chatLogs.buttonDetails}</DialogTitle>
            <DialogDescription>
              {t.chatLogs.fullButtonMetadata}
            </DialogDescription>
          </DialogHeader>
          
          {selectedButton && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="font-semibold text-sm text-muted-foreground mb-2">{t.chatLogs.buttonTextLabel}</div>
                <div className="text-lg font-medium">{selectedButton.text}</div>
              </div>
              
              {selectedButton.callback_data && (
                <div>
                  <div className="font-semibold text-sm text-muted-foreground mb-2">{t.chatLogs.callbackDataLabel}</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto border">
                    {selectedButton.callback_data}
                  </pre>
                </div>
              )}
              
              {selectedButton.url && (
                <div>
                  <div className="font-semibold text-sm text-muted-foreground mb-2">{t.chatLogs.urlLabel}</div>
                  <a 
                    href={selectedButton.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline break-all block p-3 bg-muted rounded"
                  >
                    {selectedButton.url}
                  </a>
                </div>
              )}
              
              <JsonViewer 
                data={selectedButton}
                title={t.chatLogs.fullMetadataJson}
                maxHeight="24rem"
                defaultExpanded
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔧 {t.chatLogs.toolCallDetails}</DialogTitle>
            <DialogDescription>
              {selectedLog?.server}.{selectedLog?.tool}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-muted-foreground">{t.chatLogs.timeLabel}:</span>
                  <div className="font-medium">{selectedLog.timestamp.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.chatLogs.durationLabel}:</span>
                  <div className="font-medium">{selectedLog.durationMs}ms</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.chatLogs.userIdLabel}:</span>
                  <div className="font-mono text-xs">{selectedLog.userId || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.chatLogs.sessionLabel}:</span>
                  <div className="font-mono text-xs">{selectedLog.sessionId || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t.chatLogs.statusLabel}:</span>
                  <Badge 
                    variant={selectedLog.success ? 'default' : 'destructive'}
                    className="ml-2"
                  >
                    {selectedLog.success ? `✓ ${t.chatLogs.successLabel}` : `✗ ${t.chatLogs.failedLabel}`}
                  </Badge>
                </div>
              </div>

              {/* Input JSON */}
              <JsonViewer 
                data={selectedLog.inputJson}
                title={t.chatLogs.inputArguments}
                maxHeight="20rem"
                defaultExpanded
              />

              {/* Output JSON */}
              {selectedLog.outputJson && (
                <JsonViewer 
                  data={selectedLog.outputJson}
                  title={t.chatLogs.outputResult}
                  maxHeight="20rem"
                  defaultExpanded
                />
              )}

              {/* Error Display */}
              {selectedLog.error && (
                <div className="space-y-2">
                  <div className="font-semibold text-sm text-destructive">❌ {t.chatLogs.errorDetails}</div>
                  <pre className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg text-xs overflow-auto max-h-40">
                    {selectedLog.error}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
