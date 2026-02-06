'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { PackInfoForm } from './PackInfoForm';
import { PackMessageForm } from './PackMessageForm';

interface User {
  id: string;
  firstName: string | null;
  lastName?: string | null;
  username?: string | null;
}

interface PackDetailClientProps {
  pack: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    aiModel: string | null;
    userAssignments: Array<{ telegramUserId: string }>;
  };
  users: User[];
  usersMap: Map<string, User>;
  messagesByType: Record<string, { content: string }>;
}

export function PackDetailClient({ pack, users, usersMap, messagesByType }: PackDetailClientProps) {
  const { t } = useLanguage();

  const getContent = (messageType: string, language: string) => {
    const msg = messagesByType[`${messageType}_${language}`];
    if (msg?.content) return msg.content;
    
    // Fallback to English if Persian is empty
    if (language === 'fa') {
      const enMsg = messagesByType[`${messageType}_en`];
      return enMsg?.content || '';
    }
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {pack.name}
            {pack.isDefault && (
              <span className="px-3 py-1 text-sm font-semibold text-blue-200 bg-blue-500/20 border border-blue-500/30 rounded-full">
                {t.packs.defaultPack}
              </span>
            )}
          </h1>
          <p className="mt-2 text-slate-300">{pack.description || 'No description'}</p>
        </div>
        {!pack.isDefault && (
          <form action={`/api/packs/${pack.id}/set-default`} method="POST">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-blue-200 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              {t.packs.setAsDefault}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pack Info & Users */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pack Info Card */}
          <div className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-bold text-white mb-4">
              {t.packs.packSettings}
            </h2>

            <PackInfoForm
              packId={pack.id}
              defaultName={pack.name}
              defaultDescription={pack.description || ''}
              defaultAiModel={pack.aiModel || ''}
            />
          </div>

          {/* Assigned Users Card */}
          <div className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>{t.packs.assignedUsers}</span>
              <span className="ml-auto px-2 py-1 text-xs font-semibold text-slate-200 bg-white/10 rounded-full">
                {pack.userAssignments.length}
              </span>
            </h2>
            {pack.userAssignments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">
                  {pack.isDefault ? t.packs.defaultPackInfo : t.packs.noUsers}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pack.userAssignments.map((assignment) => {
                  const user = usersMap.get(assignment.telegramUserId);
                  return (
                    <div
                      key={assignment.telegramUserId}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {user?.firstName?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {user?.firstName} {user?.lastName || ''}
                        </p>
                        <p className="text-sm text-slate-400 truncate">
                          @{user?.username || assignment.telegramUserId}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Messages */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-white">
            {t.packs.messagesTitle}
          </h2>

          {/* System Prompt - English */}
          <PackMessageForm
            packId={pack.id}
            language="en"
            messageType="system_prompt"
            defaultContent={getContent('system_prompt', 'en')}
            title={t.packs.systemPromptEn}
            subtitle={t.packs.systemPromptEnDesc}
            placeholder={t.packs.placeholderSystemEn}
            buttonText={`${t.packs.savePrompt} (EN)`}
            rows={12}
            headerBgClass="bg-emerald-500/10"
            buttonBgClass="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            focusRingClass="focus:ring-emerald-500"
          />

          {/* System Prompt - Farsi */}
          <PackMessageForm
            packId={pack.id}
            language="fa"
            messageType="system_prompt"
            defaultContent={getContent('system_prompt', 'fa')}
            title={t.packs.systemPromptFa}
            subtitle={t.packs.systemPromptFaDesc}
            placeholder={t.packs.placeholderSystemFa}
            buttonText={`${t.packs.savePrompt} (FA)`}
            rows={12}
            showFallbackWarning={!messagesByType['system_prompt_fa']?.content}
            headerBgClass="bg-slate-500/10"
            buttonBgClass="bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800"
            focusRingClass="focus:ring-slate-500"
            isRtl
          />

          {/* Welcome Message - English */}
          <PackMessageForm
            packId={pack.id}
            language="en"
            messageType="welcome"
            defaultContent={getContent('welcome', 'en')}
            title={t.packs.welcomeEn}
            subtitle={t.packs.welcomeEnDesc}
            placeholder={t.packs.placeholderWelcomeEn}
            buttonText={`${t.packs.saveWelcome} (EN)`}
            rows={8}
            headerBgClass="bg-sky-500/10"
            buttonBgClass="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
            focusRingClass="focus:ring-sky-500"
          />

          {/* Welcome Message - Farsi */}
          <PackMessageForm
            packId={pack.id}
            language="fa"
            messageType="welcome"
            defaultContent={getContent('welcome', 'fa')}
            title={t.packs.welcomeFa}
            subtitle={t.packs.welcomeFaDesc}
            placeholder={t.packs.placeholderWelcomeFa}
            buttonText={`${t.packs.saveWelcome} (FA)`}
            rows={8}
            showFallbackWarning={!messagesByType['welcome_fa']?.content}
            headerBgClass="bg-rose-500/10"
            buttonBgClass="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
            focusRingClass="focus:ring-rose-500"
            isRtl
          />
        </div>
      </div>
    </div>
  );
}
