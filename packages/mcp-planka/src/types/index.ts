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
