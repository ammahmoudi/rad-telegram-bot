'use client';

import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  role: string;
  packId?: string | null;
  packName?: string | null;
}

interface UserMultiSelectProps {
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
  placeholder?: string;
}

export function UserMultiSelect({
  users,
  selectedIds,
  onChange,
  label,
  placeholder = 'Search users...',
}: UserMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const getUserLabel = (user: User) => {
    const nameParts = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return nameParts || user.username || user.id;
  };

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.includes(u.id)),
    [users, selectedIds]
  );

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      const label = getUserLabel(user).toLowerCase();
      const username = (user.username || '').toLowerCase();
      return label.includes(query) || username.includes(query);
    });
  }, [users, searchQuery]);

  const toggleUser = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onChange(selectedIds.filter((id) => id !== userId));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm text-slate-300">{label}</label>
      
      {/* Selected users as chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm text-blue-300"
            >
              <span>{getUserLabel(user)}</span>
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-20 max-h-64 overflow-auto bg-slate-900 border border-white/10 rounded-lg shadow-xl">
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                No users found
              </div>
            ) : (
              <div className="py-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        toggleUser(user.id);
                        setSearchQuery('');
                      }}
                      className={`w-full px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{getUserLabel(user)}</div>
                          {user.username && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              @{user.username}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="text-blue-400">✓</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {selectedIds.length > 0 && (
        <div className="text-xs text-slate-500">
          {selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
