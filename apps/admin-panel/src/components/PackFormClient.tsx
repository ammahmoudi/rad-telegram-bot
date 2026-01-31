'use client';

import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';

export function PackFormClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    systemPromptEn: '',
    systemPromptFa: '',
    welcomeMessageEn: '',
    welcomeMessageFa: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('✗ Pack name is required');
      return;
    }
    
    if (!formData.systemPromptEn.trim()) {
      toast.error('✗ English system prompt is required');
      return;
    }
    
    if (!formData.welcomeMessageEn.trim()) {
      toast.error('✗ English welcome message is required');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('🎭 Creating character pack...');

    try {
      const res = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.id) {
        toast.success('✓ Character pack created successfully!', {
          id: loadingToast,
        });
        setTimeout(() => router.push(`/packs/${data.id}`), 1000);
      } else {
        toast.error(`✗ ${data.error || 'Failed to create pack'}`, {
          id: loadingToast,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(`✗ ${error instanceof Error ? error.message : 'Failed to create pack'}`, {
        id: loadingToast,
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Basic Information</h2>
              <p className="text-sm text-slate-400">Pack name, description, and settings</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-white block">
              Pack Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Professional Assistant"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-white block">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Describe this character pack..."
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" dir="ltr">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
              disabled={loading}
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-white flex-1 cursor-pointer">
              ⭐ Set as default pack for new users
            </label>
          </div>
        </div>

        {/* System Prompts */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">System Prompts</h2>
              <p className="text-sm text-slate-400">AI behavior and personality</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="systemPromptEn" className="text-sm font-medium text-white block">
              English System Prompt *
            </label>
            <textarea
              id="systemPromptEn"
              required
              value={formData.systemPromptEn}
              onChange={(e) => setFormData({ ...formData, systemPromptEn: e.target.value })}
              rows={10}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono resize-none"
              placeholder="You are a helpful AI assistant..."
              disabled={loading}
              dir="ltr"
            />
            <p className="text-xs text-slate-400">Define how the AI should behave in English conversations</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="systemPromptFa" className="text-sm font-medium text-white block">
              Persian/Farsi System Prompt (Optional)
            </label>
            <textarea
              id="systemPromptFa"
              value={formData.systemPromptFa}
              onChange={(e) => setFormData({ ...formData, systemPromptFa: e.target.value })}
              rows={10}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono resize-none"
              placeholder="شما یک دستیار هوشمند..."
              disabled={loading}
              dir="rtl"
            />
            <p className="text-xs text-slate-400">If not provided, English prompt will be used as fallback</p>
          </div>
        </div>

        {/* Welcome Messages */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-linear-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Welcome Messages</h2>
              <p className="text-sm text-slate-400">Greetings shown when users first interact</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="welcomeMessageEn" className="text-sm font-medium text-white block">
              English Welcome Message *
            </label>
            <textarea
              id="welcomeMessageEn"
              required
              value={formData.welcomeMessageEn}
              onChange={(e) => setFormData({ ...formData, welcomeMessageEn: e.target.value })}
              rows={8}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="👋 Hi {name}!&#10;&#10;Welcome to our AI assistant..."
              disabled={loading}
              dir="ltr"
            />
            <p className="text-xs text-slate-400">Use {'{name}'} placeholder for user's name</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="welcomeMessageFa" className="text-sm font-medium text-white block">
              Persian/Farsi Welcome Message (Optional)
            </label>
            <textarea
              id="welcomeMessageFa"
              value={formData.welcomeMessageFa}
              onChange={(e) => setFormData({ ...formData, welcomeMessageFa: e.target.value })}
              rows={8}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="👋 سلام {name}!&#10;&#10;خوش آمدید..."
              disabled={loading}
              dir="rtl"
            />
            <p className="text-xs text-slate-400">Use {'{name}'} for user's name. If not provided, English message will be used</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-200"
            disabled={loading}
          >
            ← Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                🎭 Create Pack
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
