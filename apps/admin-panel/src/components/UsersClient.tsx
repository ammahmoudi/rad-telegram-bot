'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useState } from 'react';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  role: string;
  lastSeenAt: Date | bigint | null;
}

interface Assignment {
  pack: {
    id: string;
    name: string;
  };
}

interface UsersClientProps {
  users: User[];
  roleConfig: Record<string, { label: string; color: string }>;
  assignmentMap: Map<string, Assignment>;
  plankaSet: Set<string>;
  rastarSet: Set<string>;
}

export function UsersClient({ users, roleConfig, assignmentMap, plankaSet, rastarSet }: UsersClientProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
    const username = user.username?.toLowerCase() || '';
    const userId = user.id.toLowerCase();
    
    return fullName.includes(query) || username.includes(query) || userId.includes(query);
  });

  if (users.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-12 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-bold text-white mb-2">{t.users.title}</h3>
        <p className="text-slate-300">
          {t.users.searchPlaceholder}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.users.search}
            className="w-full px-4 py-2 pl-10 border border-white/10 bg-white/5 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchQuery && (
          <p className="text-sm text-slate-400 mt-2">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
          </p>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No users found</h3>
            <p className="text-slate-300">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">{t.users.name}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">{t.users.role}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">{t.users.connections}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">{t.users.characterPack}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Last Activity</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const assignment = assignmentMap.get(user.id);
              const hasPlankaconnection = plankaSet.has(user.id);
              const hasRastar = rastarSet.has(user.id);
              const roleInfo = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user;

              return (
                <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(user.firstName || user.username || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : user.username || `User ${user.id.slice(0, 6)}`}
                        </div>
                        {user.username && (
                          <div className="text-sm text-slate-400">@{user.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold text-white bg-linear-to-r ${roleInfo.color}`}>
                      {t.users.roles[user.role as keyof typeof t.users.roles] || roleInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          hasPlankaconnection
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {hasPlankaconnection ? '✓' : '✗'} {t.users.planka}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          hasRastar
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {hasRastar ? '✓' : '✗'} {t.users.rastar}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">
                      {assignment ? assignment.pack.name : t.users.defaultPack}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {user.lastSeenAt
                      ? new Date(Number(user.lastSeenAt)).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/users/${user.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
          </div>
        )}
      </div>
    </div>
  );
}
