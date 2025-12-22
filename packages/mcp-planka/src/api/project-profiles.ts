import { plankaFetch } from './client.js';
import type {
  PlankaAuth,
  ProjectId,
  ProjectProfileId,
  ProjectProfileSectionId,
  ProjectProfileFieldId,
  ProjectProfilePersonId,
} from '../types/index.js';

/**
 * Project Profiles API
 * Manage project profiles, sections, fields, and people
 */

// ========== Project Profiles ==========

export interface ProjectProfile {
  id: ProjectProfileId;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectProfileData {
  name: string;
  description?: string;
}

/**
 * Create project profile
 * @param auth - Planka authentication
 * @param data - Profile data
 */
export async function createProjectProfile(
  auth: PlankaAuth,
  data: CreateProjectProfileData,
): Promise<ProjectProfile> {
  return plankaFetch<ProjectProfile>(auth, '/api/project-profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get all project profiles
 * @param auth - Planka authentication
 */
export async function listProjectProfiles(auth: PlankaAuth): Promise<ProjectProfile[]> {
  return plankaFetch<ProjectProfile[]>(auth, '/api/project-profiles', {
    method: 'GET',
  });
}

/**
 * Get project profile
 * @param auth - Planka authentication
 * @param id - Profile ID
 */
export async function getProjectProfile(
  auth: PlankaAuth,
  id: ProjectProfileId,
): Promise<ProjectProfile> {
  return plankaFetch<ProjectProfile>(auth, `/api/project-profiles/${id}`, {
    method: 'GET',
  });
}

/**
 * Update project profile
 * @param auth - Planka authentication
 * @param id - Profile ID
 * @param data - Update data
 */
export async function updateProjectProfile(
  auth: PlankaAuth,
  id: ProjectProfileId,
  data: Partial<CreateProjectProfileData>,
): Promise<ProjectProfile> {
  return plankaFetch<ProjectProfile>(auth, `/api/project-profiles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete project profile
 * @param auth - Planka authentication
 * @param id - Profile ID
 */
export async function deleteProjectProfile(
  auth: PlankaAuth,
  id: ProjectProfileId,
): Promise<ProjectProfile> {
  return plankaFetch<ProjectProfile>(auth, `/api/project-profiles/${id}`, {
    method: 'DELETE',
  });
}

// ========== Project Profile Sections ==========

export interface ProjectProfileSection {
  id: ProjectProfileSectionId;
  profileId: ProjectProfileId;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create project profile section
 * @param auth - Planka authentication
 * @param profileId - Profile ID
 * @param data - Section data
 */
export async function createProjectProfileSection(
  auth: PlankaAuth,
  profileId: ProjectProfileId,
  data: { name: string; position?: number },
): Promise<ProjectProfileSection> {
  return plankaFetch<ProjectProfileSection>(auth, `/api/project-profiles/${profileId}/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update project profile section
 * @param auth - Planka authentication
 * @param id - Section ID
 * @param data - Update data
 */
export async function updateProjectProfileSection(
  auth: PlankaAuth,
  id: ProjectProfileSectionId,
  data: { name?: string; position?: number },
): Promise<ProjectProfileSection> {
  return plankaFetch<ProjectProfileSection>(auth, `/api/project-profile-sections/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete project profile section
 * @param auth - Planka authentication
 * @param id - Section ID
 */
export async function deleteProjectProfileSection(
  auth: PlankaAuth,
  id: ProjectProfileSectionId,
): Promise<ProjectProfileSection> {
  return plankaFetch<ProjectProfileSection>(auth, `/api/project-profile-sections/${id}`, {
    method: 'DELETE',
  });
}

// ========== Project Profile Fields ==========

export interface ProjectProfileField {
  id: ProjectProfileFieldId;
  sectionId: ProjectProfileSectionId;
  name: string;
  type: 'text' | 'number' | 'date';
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create project profile field
 * @param auth - Planka authentication
 * @param sectionId - Section ID
 * @param data - Field data
 */
export async function createProjectProfileField(
  auth: PlankaAuth,
  sectionId: ProjectProfileSectionId,
  data: { name: string; type: 'text' | 'number' | 'date'; position?: number },
): Promise<ProjectProfileField> {
  return plankaFetch<ProjectProfileField>(auth, `/api/project-profile-sections/${sectionId}/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update project profile field
 * @param auth - Planka authentication
 * @param id - Field ID
 * @param data - Update data
 */
export async function updateProjectProfileField(
  auth: PlankaAuth,
  id: ProjectProfileFieldId,
  data: { name?: string; type?: 'text' | 'number' | 'date'; position?: number },
): Promise<ProjectProfileField> {
  return plankaFetch<ProjectProfileField>(auth, `/api/project-profile-fields/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete project profile field
 * @param auth - Planka authentication
 * @param id - Field ID
 */
export async function deleteProjectProfileField(
  auth: PlankaAuth,
  id: ProjectProfileFieldId,
): Promise<ProjectProfileField> {
  return plankaFetch<ProjectProfileField>(auth, `/api/project-profile-fields/${id}`, {
    method: 'DELETE',
  });
}

// ========== Project Profile People ==========

export interface ProjectProfilePerson {
  id: ProjectProfilePersonId;
  projectId: ProjectId;
  fieldId: ProjectProfileFieldId;
  userId: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Add person to profile field
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param fieldId - Field ID
 * @param data - Person data
 */
export async function addPersonToProfileField(
  auth: PlankaAuth,
  projectId: ProjectId,
  fieldId: ProjectProfileFieldId,
  data: { userId: string; role?: string },
): Promise<ProjectProfilePerson> {
  return plankaFetch<ProjectProfilePerson>(auth, `/api/projects/${projectId}/profile-people/${fieldId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get people assigned to profile field
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param fieldId - Field ID
 */
export async function getProfileFieldPeople(
  auth: PlankaAuth,
  projectId: ProjectId,
  fieldId: ProjectProfileFieldId,
): Promise<ProjectProfilePerson[]> {
  return plankaFetch<ProjectProfilePerson[]>(auth, `/api/projects/${projectId}/profile-people/${fieldId}`, {
    method: 'GET',
  });
}

/**
 * Update person's role in profile field
 * @param auth - Planka authentication
 * @param id - Profile person ID
 * @param data - Update data
 */
export async function updateProjectProfilePerson(
  auth: PlankaAuth,
  id: ProjectProfilePersonId,
  data: { role?: string },
): Promise<ProjectProfilePerson> {
  return plankaFetch<ProjectProfilePerson>(auth, `/api/project-profile-people/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Remove person from profile field
 * @param auth - Planka authentication
 * @param id - Profile person ID
 */
export async function removePersonFromProfileField(
  auth: PlankaAuth,
  id: ProjectProfilePersonId,
): Promise<ProjectProfilePerson> {
  return plankaFetch<ProjectProfilePerson>(auth, `/api/project-profile-people/${id}`, {
    method: 'DELETE',
  });
}
