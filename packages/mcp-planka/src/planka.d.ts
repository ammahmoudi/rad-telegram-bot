// ===== Type Definitions =====
export type PlankaAuth = {
  plankaBaseUrl: string;
  accessToken: string;
};

export interface PlankaProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaBoard {
  id: string;
  name: string;
  position: number;
  projectId: string;
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
  position: number;
  listId: string;
  boardId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaLabel {
  id: string;
  name: string;
  color: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlankaUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
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
}

// ===== Function Declarations =====
export declare function plankaFetch<T>(auth: PlankaAuth, path: string, init?: RequestInit): Promise<T>;

// Project Operations
export declare function listProjects(auth: PlankaAuth): Promise<PlankaProject[]>;
export declare function getProject(auth: PlankaAuth, projectId: string): Promise<any>;

// Board Operations
export declare function getBoard(auth: PlankaAuth, boardId: string): Promise<any>;
export declare function createBoard(auth: PlankaAuth, projectId: string, name: string, position?: number): Promise<PlankaBoard>;
export declare function updateBoard(auth: PlankaAuth, boardId: string, updates: { name?: string; position?: number }): Promise<PlankaBoard>;
export declare function deleteBoard(auth: PlankaAuth, boardId: string): Promise<any>;

// List Operations
export declare function createList(auth: PlankaAuth, boardId: string, name: string, position?: number, color?: string): Promise<PlankaList>;
export declare function updateList(auth: PlankaAuth, listId: string, updates: { name?: string; position?: number; color?: string }): Promise<PlankaList>;
export declare function archiveList(auth: PlankaAuth, listId: string): Promise<PlankaList>;
export declare function deleteList(auth: PlankaAuth, listId: string): Promise<any>;

// Card Operations
export declare function createCard(auth: PlankaAuth, listId: string, name: string, description?: string, position?: number, dueDate?: string): Promise<PlankaCard>;
export declare function updateCard(auth: PlankaAuth, cardId: string, updates: { name?: string; description?: string; dueDate?: string; position?: number }): Promise<PlankaCard>;
export declare function moveCard(auth: PlankaAuth, cardId: string, listId: string, position?: number): Promise<PlankaCard>;
export declare function deleteCard(auth: PlankaAuth, cardId: string): Promise<any>;

// Label Operations
export declare function getLabels(auth: PlankaAuth, boardId: string): Promise<PlankaLabel[]>;
export declare function createLabel(auth: PlankaAuth, boardId: string, name: string, color: string, position?: number): Promise<PlankaLabel>;
export declare function updateLabel(auth: PlankaAuth, labelId: string, updates: { name?: string; color?: string; position?: number }): Promise<PlankaLabel>;
export declare function deleteLabel(auth: PlankaAuth, labelId: string): Promise<any>;
export declare function assignLabelToCard(auth: PlankaAuth, cardId: string, labelId: string): Promise<any>;
export declare function removeLabelFromCard(auth: PlankaAuth, cardId: string, labelId: string): Promise<any>;

// Member Operations
export declare function getMembers(auth: PlankaAuth, projectId: string): Promise<PlankaUser[]>;
export declare function assignMemberToCard(auth: PlankaAuth, cardId: string, userId: string): Promise<any>;
export declare function removeMemberFromCard(auth: PlankaAuth, cardId: string, userId: string): Promise<any>;

// Comment Operations
export declare function getComments(auth: PlankaAuth, cardId: string): Promise<PlankaComment[]>;
export declare function createComment(auth: PlankaAuth, cardId: string, text: string): Promise<PlankaComment>;
export declare function updateComment(auth: PlankaAuth, commentId: string, text: string): Promise<PlankaComment>;
export declare function deleteComment(auth: PlankaAuth, commentId: string): Promise<any>;

// Task List Operations
export declare function createTaskList(auth: PlankaAuth, cardId: string, name: string, position?: number): Promise<PlankaTaskList>;
export declare function updateTaskList(auth: PlankaAuth, taskListId: string, updates: { name?: string; position?: number }): Promise<PlankaTaskList>;
export declare function deleteTaskList(auth: PlankaAuth, taskListId: string): Promise<any>;

// Task Operations
export declare function createTask(auth: PlankaAuth, taskListId: string, name: string, position?: number): Promise<PlankaTask>;
export declare function updateTask(auth: PlankaAuth, taskId: string, updates: { name?: string; isCompleted?: boolean; position?: number }): Promise<PlankaTask>;
export declare function deleteTask(auth: PlankaAuth, taskId: string): Promise<any>;

// Attachment Operations
export declare function getAttachments(auth: PlankaAuth, cardId: string): Promise<PlankaAttachment[]>;
export declare function deleteAttachment(auth: PlankaAuth, attachmentId: string): Promise<any>;
