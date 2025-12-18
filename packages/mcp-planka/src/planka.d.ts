export type PlankaAuth = {
    plankaBaseUrl: string;
    accessToken: string;
};
export declare function plankaFetch<T>(auth: PlankaAuth, path: string, init?: RequestInit): Promise<T>;
export declare function listProjects(auth: PlankaAuth): Promise<any[]>;
export declare function getProject(auth: PlankaAuth, projectId: string): Promise<any>;
export declare function getBoard(auth: PlankaAuth, boardId: string): Promise<any>;
export declare function moveCard(auth: PlankaAuth, cardId: string, listId: string, position?: number): Promise<any>;
