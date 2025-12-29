'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface PackMessageFormProps {
  packId: string;
  language: 'en' | 'fa';
  messageType: 'system_prompt' | 'welcome';
  defaultContent: string;
  title: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
  rows: number;
  showFallbackWarning?: boolean;
  headerBgClass: string;
  buttonBgClass: string;
  focusRingClass: string;
  isRtl?: boolean;
}

export function PackMessageForm({
  packId,
  language,
  messageType,
  defaultContent,
  title,
  subtitle,
  placeholder,
  buttonText,
  rows,
  showFallbackWarning,
  headerBgClass,
  buttonBgClass,
  focusRingClass,
  isRtl,
}: PackMessageFormProps) {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/packs/${packId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          messageType,
          content,
        }),
      });

      if (res.ok) {
        toast.success(`✓ ${t.success}!`);
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

  return (
    <div className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl border border-white/20 overflow-hidden">
      <div className={`${headerBgClass} px-6 py-4 border-b border-white/20`}>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {title}
        </h3>
        <p className="text-sm text-slate-300 mt-1">{subtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={rows}
          className={`w-full px-4 py-3 border border-white/10 rounded-lg focus:outline-none focus:ring-2 ${focusRingClass} focus:border-transparent ${
            messageType === 'system_prompt' ? 'font-mono' : ''
          } text-sm bg-white/5 text-white placeholder:text-slate-400 transition-all`}
          placeholder={placeholder}
          dir={isRtl ? 'rtl' : 'ltr'}
        />
        {showFallbackWarning && (
          <p className="mt-2 text-sm text-amber-400 flex items-center gap-2">
            {t.packs.usingFallback}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`mt-4 px-6 py-2.5 ${buttonBgClass} text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
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
            buttonText
          )}
        </button>
      </form>
    </div>
  );
}
