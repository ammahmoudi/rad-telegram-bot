import type { CSSProperties } from 'react';

import { listPlankaTokens } from '@rastar/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const tokens = await listPlankaTokens();

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
      <h1>Rastar Admin</h1>
      <p>Linked Planka accounts (tokens are never displayed).</p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Telegram User ID</th>
            <th style={th}>Planka Base URL</th>
            <th style={th}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.telegramUserId}>
              <td style={td}>{t.telegramUserId}</td>
              <td style={td}>{t.plankaBaseUrl}</td>
              <td style={td}>{new Date(t.updatedAt).toISOString()}</td>
            </tr>
          ))}
          {tokens.length === 0 ? (
            <tr>
              <td style={td} colSpan={3}>
                No linked users.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </main>
  );
}

const th: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
};

const td: CSSProperties = {
  padding: '8px 10px',
  verticalAlign: 'top',
};
