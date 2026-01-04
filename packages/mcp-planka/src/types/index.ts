export type PlankaAuth = {
  plankaBaseUrl: string;
  accessToken: string;
};

export interface PlankaProject {
  id: string;
  name: string;
  description?: string | null;
  backgroundType?: string;
  backgroundGradient?: string;
  isHidden?: boolean;
  ownerProjectManagerId?: string | null;
  backgroundImageId?: string | null;
  isFavorite?: boolean;
  categoryId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaBoard {
  id: string;
  name: string;
  position: number;
  projectId: string;
  defaultView?: string; // 'kanban', 'list', etc.
  defaultCardType?: string; // 'project', 'story', etc.
  limitCardTypesToDefaultOne?: boolean;
  alwaysDisplayCardCreator?: boolean;
  expandTaskListsByDefault?: boolean;
  calendarType?: string; // 'gregorian', 'persian', etc.
  isListsLocked?: boolean;
  templateId?: string | null;
  isSubscribed?: boolean;
  cardTypes?: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaList {
  id: string;
  name: string;
  position: number;
  boardId: string;
  type?: string;
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaCard {
  id: string;
  name: string;
  description?: string;
  type?: string; // 'project', 'story', etc.
  position: number;
  listId: string;
  boardId: string;
  creatorUserId?: string;
  color?: string;
  startDate?: string;
  dueDate?: string;
  isDueCompleted?: boolean | null; // Planka's "done" checkbox
  stopwatch?: any;
  commentsTotal?: number;
  isClosed?: boolean;
  listChangedAt?: string;
  weight?: number;
  storyPoints?: number | null;
  isSyncEnabled?: boolean;
  prevListId?: string | null;
  coverAttachmentId?: string | null;
  parentCardId?: string | null;
  syncedFromCardId?: string | null;
  isSubscribed?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaLabel {
  id: string;
  name: string;
  color: string;
  position: number;
  boardId: string | null; // null for global labels
  isGlobal?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PlankaUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
  phone?: string;
  organization?: string;
  permissions?: string[];
  language?: string;
  subscribeToOwnCards?: boolean;
  subscribeToCardWhenCommenting?: boolean;
  turnOffRecentCardHighlighting?: boolean;
  enableFavoritesByDefault?: boolean;
  defaultEditorMode?: string; // 'wysiwyg' | 'markdown'
  defaultHomeView?: string; // 'groupedProjects' | 'ungroupedProjects'
  defaultProjectsOrder?: string; // 'byDefault' | 'byName'
  isSsoUser?: boolean;
  isDeactivated?: boolean;
  managerUser?: any;
  avatar?: any;
  termsType?: string;
  isDefaultAdmin?: boolean;
  lockedFieldNames?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaComment {
  id: string;
  type: string;
  data: {
    text: string;
  };
  cardId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaTaskList {
  id: string;
  name: string;
  position: number;
  cardId: string;
  showOnFrontOfCard: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaTask {
  id: string;
  name: string;
  position: number;
  taskListId: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaAttachment {
  id: string;
  name: string;
  cardId: string;
  creatorUserId: string;
  createdAt: string;
  updatedAt?: string;
  url?: string;
  coverUrl?: string;
}

// Extended interfaces for new API entities

export interface PlankaSpace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaFolder {
  id: string;
  name: string;
  spaceId: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaFile {
  id: string;
  name: string;
  spaceId: string;
  folderId?: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaTeam {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaProjectCategory {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaBackgroundImage {
  id: string;
  name: string;
  url: string;
  projectId: string;
  createdAt: string;
}

export interface PlankaBoardLink {
  id: string;
  boardId: string;
  url: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaBoardRelease {
  id: string;
  boardId: string;
  name: string;
  version?: string;
  status?: string;
  releaseDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaBoardTeam {
  id: string;
  boardId: string;
  teamId: string;
  role?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaBoardTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaCardType {
  id: string;
  boardTemplateId: string;
  name: string;
  color?: string;
  position: number;
  createdAt: string;
}

export interface PlankaBoardVersion {
  id: string;
  boardId: string;
  name: string;
  snapshot?: any;
  createdAt: string;
}

export interface PlankaProjectVersion {
  id: string;
  projectId: string;
  name: string;
  snapshot?: any;
  createdAt: string;
}

export interface PlankaCustomFieldGroup {
  id: string;
  name: string;
  boardId?: string;
  cardId?: string;
  baseCustomFieldGroupId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaCustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  customFieldGroupId?: string;
  baseCustomFieldGroupId?: string;
  options?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaCustomFieldValue {
  cardId: string;
  customFieldGroupId: string;
  customFieldId: string;
  value: any;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaProjectManager {
  id: string;
  projectId: string;
  userId: string;
  createdAt: string;
}

export interface PlankaProjectTeam {
  id: string;
  projectId: string;
  teamId: string;
  role?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaProjectRelease {
  id: string;
  projectId: string;
  name: string;
  version?: string;
  status?: string;
  releaseDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaProjectProfile {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaProjectProfileSection {
  id: string;
  projectProfileId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaProjectProfileField {
  id: string;
  projectProfileSectionId: string;
  name: string;
  type: string;
  position: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaProjectProfilePerson {
  id: string;
  projectProfileFieldId: string;
  userId: string;
  role?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaReport {
  id: string;
  name: string;
  description?: string;
  type?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaReportPhase {
  id: string;
  reportId: string;
  name: string;
  position: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaShareLink {
  id: string;
  token: string;
  resourceType: string;
  resourceId: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaNotificationService {
  id: string;
  type: string;
  name: string;
  config: any;
  boardId?: string;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaNotification {
  id: string;
  type: string; // 'moveCard', 'addComment', etc.
  data: any; // Dynamic based on type
  isRead: boolean;
  userId: string; // Recipient
  creatorUserId: string; // Who caused the notification
  boardId: string;
  cardId: string;
  commentId?: string | null;
  actionId: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PlankaAction {
  id: string;
  type: string; // 'createCard', 'moveCard', 'updateCard', etc.
  data: any; // Dynamic content based on action type
  boardId: string;
  cardId: string;
  userId: string; // Who performed the action
  createdAt: string;
  updatedAt?: string | null;
}

export interface PlankaWebhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaPermission {
  id: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  permissions: string[];
  createdAt: string;
}

export interface PlankaTerms {
  type: string;
  content: string;
  version: string;
  updatedAt: string;
}

export interface PlankaDocumentActivity {
  id: string;
  type: string;
  documentType: string;
  documentId: string;
  userId: string;
  data: any;
  createdAt: string;
}

export interface PlankaConfig {
  version: string;
  oidcEnabled: boolean;
  termsEnabled: boolean;
  features: {
    spaces?: boolean;
    templates?: boolean;
    customFields?: boolean;
    [key: string]: any;
  };
}

export interface PlankaBoardMembership {
  id: string;
  boardId: string;
  userId: string;
  role: string;
  canComment: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaTeamMembership {
  id: string;
  teamId: string;
  userId: string;
  role?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaCardDependency {
  cardId: string;
  dependsOnCardId: string;
  createdAt: string;
}

// Type aliases for improved type safety
export type ProjectId = string;
export type BoardId = string;
export type ListId = string;
export type CardId = string;
export type LabelId = string;
export type UserId = string;
export type CommentId = string;
export type TaskListId = string;
export type TaskId = string;
export type AttachmentId = string;
export type TeamId = string;
export type TeamMembershipId = string;
export type BoardMembershipId = string;
export type CardMembershipId = string;
export type ActionId = string;
export type NotificationId = string;
export type NotificationServiceId = string;
export type WebhookId = string;
export type PermissionId = string;
export type BackgroundImageId = string;
export type BoardLinkId = string;
export type ReleaseId = string;
export type BoardTeamId = string;
export type SpaceId = string;
export type FolderId = string;
export type FileId = string;
export type ProjectCategoryId = string;
export type UploadedFile = File | Buffer;
export type BaseCustomFieldGroupId = string;
export type CustomFieldGroupId = string;
export type CustomFieldId = string;
export type BoardTemplateId = string;
export type CardTypeId = string;
export type VersionId = string;
export type ProjectManagerId = string;
export type ProjectProfileId = string;
export type ProjectProfileSectionId = string;
export type ProjectProfileFieldId = string;
export type ProjectProfilePersonId = string;
export type ProjectTeamId = string;
export type ReportId = string;
export type ReportPhaseId = string;
export type ShareLinkId = string;
