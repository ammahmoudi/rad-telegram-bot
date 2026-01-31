'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

interface Pack {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date | bigint;
  _count: {
    messages: number;
    userAssignments: number;
  };
}

interface PacksClientProps {
  packs: Pack[];
}

export function PacksClient({ packs }: PacksClientProps) {
  const { t } = useLanguage();

  if (packs.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-12 text-center">
        <div className="text-6xl mb-4">🎭</div>
        <h3 className="text-xl font-bold text-white mb-2">{t.packs.title}</h3>
        <p className="text-slate-300 mb-6">
          {t.packs.subtitle}
        </p>
        <Link
          href="/packs/new"
          className="inline-block px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all"
        >
          {t.packs.createNew}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packs.map((pack) => (
        <Link
          key={pack.id}
          href={`/packs/${pack.id}`}
          className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all group block"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                {pack.name}
              </h3>
              {pack.isDefault && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-medium rounded-full border border-amber-500/30">
                  ⭐ {t.packs.defaultPack}
                </span>
              )}
            </div>
          </div>

          {pack.description && (
            <p className="text-slate-300 text-sm mb-4 line-clamp-2">
              {pack.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex gap-4 text-sm">
              <span className="text-slate-400">
                {t.packs.messages}: <span className="text-white font-medium">{pack._count.messages}</span>
              </span>
              <span className="text-slate-400">
                {t.packs.users}: <span className="text-white font-medium">{pack._count.userAssignments}</span>
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            {t.packs.createdAt}: {new Date(Number(pack.createdAt)).toLocaleDateString()}
          </div>
        </Link>
      ))}
    </div>
  );
}
