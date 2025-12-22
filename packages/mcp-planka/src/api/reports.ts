import { plankaFetch } from './client.js';
import type { PlankaAuth, ReportId, ReportPhaseId } from '../types/index.js';

/**
 * Reports and Report Phases API
 * Manage reports and their phases
 */

// ========== Reports ==========

export interface Report {
  id: ReportId;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateReportData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Create report
 * @param auth - Planka authentication
 * @param data - Report data
 */
export async function createReport(
  auth: PlankaAuth,
  data: CreateReportData,
): Promise<Report> {
  return plankaFetch<Report>(auth, '/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get all reports
 * @param auth - Planka authentication
 */
export async function listReports(auth: PlankaAuth): Promise<Report[]> {
  return plankaFetch<Report[]>(auth, '/api/reports', {
    method: 'GET',
  });
}

/**
 * Get report details
 * @param auth - Planka authentication
 * @param id - Report ID
 */
export async function getReport(auth: PlankaAuth, id: ReportId): Promise<Report> {
  return plankaFetch<Report>(auth, `/api/reports/${id}`, {
    method: 'GET',
  });
}

/**
 * Update report
 * @param auth - Planka authentication
 * @param id - Report ID
 * @param data - Update data
 */
export async function updateReport(
  auth: PlankaAuth,
  id: ReportId,
  data: UpdateReportData,
): Promise<Report> {
  return plankaFetch<Report>(auth, `/api/reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete report
 * @param auth - Planka authentication
 * @param id - Report ID
 */
export async function deleteReport(auth: PlankaAuth, id: ReportId): Promise<Report> {
  return plankaFetch<Report>(auth, `/api/reports/${id}`, {
    method: 'DELETE',
  });
}

// ========== Report Phases ==========

export interface ReportPhase {
  id: ReportPhaseId;
  reportId: ReportId;
  name: string;
  description?: string;
  position: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportPhaseData {
  name: string;
  description?: string;
  position?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateReportPhaseData {
  name?: string;
  description?: string;
  position?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Create report phase
 * @param auth - Planka authentication
 * @param reportId - Report ID
 * @param data - Phase data
 */
export async function createReportPhase(
  auth: PlankaAuth,
  reportId: ReportId,
  data: CreateReportPhaseData,
): Promise<ReportPhase> {
  return plankaFetch<ReportPhase>(auth, `/api/reports/${reportId}/phases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update report phase
 * @param auth - Planka authentication
 * @param id - Phase ID
 * @param data - Update data
 */
export async function updateReportPhase(
  auth: PlankaAuth,
  id: ReportPhaseId,
  data: UpdateReportPhaseData,
): Promise<ReportPhase> {
  return plankaFetch<ReportPhase>(auth, `/api/report-phases/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete report phase
 * @param auth - Planka authentication
 * @param id - Phase ID
 */
export async function deleteReportPhase(
  auth: PlankaAuth,
  id: ReportPhaseId,
): Promise<ReportPhase> {
  return plankaFetch<ReportPhase>(auth, `/api/report-phases/${id}`, {
    method: 'DELETE',
  });
}
