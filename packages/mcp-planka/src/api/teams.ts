import type { PlankaAuth, PlankaTeam, PlankaTeamMembership } from '../types/index.js';
import { plankaFetch } from './client.js';

// Teams
export async function listTeams(auth: PlankaAuth): Promise<any[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any }>(auth, '/api/teams', {
    method: 'GET',
  });

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function getTeam(auth: PlankaAuth, teamId: string): Promise<PlankaTeam> {
  return await plankaFetch(auth, `/api/teams/${encodeURIComponent(teamId)}`, {
    method: 'GET',
  });
}

export async function createTeam(auth: PlankaAuth, name: string, description?: string): Promise<PlankaTeam> {
  return await plankaFetch(auth, '/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
}

export async function updateTeam(
  auth: PlankaAuth,
  teamId: string,
  updates: { name?: string; description?: string },
): Promise<PlankaTeam> {
  return await plankaFetch(auth, `/api/teams/${encodeURIComponent(teamId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteTeam(auth: PlankaAuth, teamId: string): Promise<PlankaTeam> {
  return await plankaFetch(auth, `/api/teams/${encodeURIComponent(teamId)}`, {
    method: 'DELETE',
  });
}

// Team Memberships
export async function addTeamMembership(
  auth: PlankaAuth,
  teamId: string,
  userId: string,
  role?: string,
): Promise<any> {
  return await plankaFetch(auth, `/api/teams/${encodeURIComponent(teamId)}/team-memberships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role }),
  });
}

export async function updateTeamMembership(
  auth: PlankaAuth,
  membershipId: string,
  updates: { role?: string },
): Promise<any> {
  return await plankaFetch(auth, `/api/team-memberships/${encodeURIComponent(membershipId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteTeamMembership(auth: PlankaAuth, membershipId: string): Promise<PlankaTeamMembership> {
  return await plankaFetch(auth, `/api/team-memberships/${encodeURIComponent(membershipId)}`, {
    method: 'DELETE',
  });
}
