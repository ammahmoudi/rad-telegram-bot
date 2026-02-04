'use client';

import { X } from 'lucide-react';

interface Pack {
  id: string;
  name: string;
}

interface PackMultiSelectProps {
  packs: Pack[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
}

export function PackMultiSelect({ packs, selectedIds, onChange, label }: PackMultiSelectProps) {
  const selectedPacks = packs.filter((p) => selectedIds.includes(p.id));
  const unselectedPacks = packs.filter((p) => !selectedIds.includes(p.id));

  const togglePack = (packId: string) => {
    if (selectedIds.includes(packId)) {
      onChange(selectedIds.filter((id) => id !== packId));
    } else {
      onChange([...selectedIds, packId]);
    }
  };

  const removePack = (packId: string) => {
    onChange(selectedIds.filter((id) => id !== packId));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm text-slate-300">{label}</label>

      {/* Selected packs as chips */}
      {selectedPacks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPacks.map((pack) => (
            <div
              key={pack.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
            >
              <span>{pack.name}</span>
              <button
                type="button"
                onClick={() => removePack(pack.id)}
                className="hover:bg-purple-500/20 rounded-full p-0.5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available packs */}
      {unselectedPacks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unselectedPacks.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => togglePack(pack.id)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-slate-400 hover:bg-white/10 hover:text-slate-300 hover:border-white/20 transition-all"
            >
              + {pack.name}
            </button>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="text-xs text-slate-500">
          {selectedIds.length} pack{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
