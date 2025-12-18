import { getPlankaToken } from '@rastar/shared';
import {
  type PlankaAuth,
  listProjects,
  getProject,
  getBoard,
  createCard,
  updateCard,
} from '@rastar/mcp-planka/planka';

export interface ToolExecutionResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Execute a Planka MCP tool call
 */
export async function executePlankaTool(
  telegramUserId: string,
  toolName: string,
  args: Record<string, any>,
): Promise<ToolExecutionResult> {
  console.log('[executePlankaTool]', { toolName, args });
  try {
    // Get user's Planka credentials
    const token = await getPlankaToken(telegramUserId);
    if (!token) {
      return {
        success: false,
        content: '',
        error: 'Planka account not linked. Use /link_planka to connect.',
      };
    }

    const auth = {
      plankaBaseUrl: token.plankaBaseUrl,
      accessToken: token.accessToken,
    };

    // Route to appropriate tool handler
    switch (toolName) {
      case 'planka_projects_list':
        return await handleListProjects(auth);

      case 'planka_boards_list':
        return await handleListBoards(auth, args.projectId);

      case 'planka_lists_list':
        return await handleListLists(auth, args.boardId);

      case 'planka_list_cards':
        return await handleListCards(auth, args.boardId, args.listId);

      case 'planka_cards_create':
        return await handleCreateCard(auth, args.listId, args.name, args.description, args.position);

      case 'planka_cards_update':
        return await handleUpdateCard(auth, args.cardId, args.name, args.description);

      case 'planka_cards_search':
        return await handleSearchCards(auth, args.boardId, args.query);

      default:
        return {
          success: false,
          content: '',
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    console.error(`[executePlankaTool] Error executing ${toolName}:`, error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function handleListProjects(auth: PlankaAuth): Promise<ToolExecutionResult> {
  console.log('[handleListProjects] Fetching projects');
  const projects = await listProjects(auth);
  console.log('[handleListProjects] Projects found:', projects.length);
  if (projects.length > 0) {
    console.log('[handleListProjects] First project structure:', JSON.stringify(projects[0], null, 2));
  }

  if (!projects || projects.length === 0) {
    return {
      success: true,
      content: 'No projects found. You may not have access to any projects yet.',
    };
  }

  const projectList = projects
    .map((p: any, idx: number) => {
      const name = p.name || 'Unnamed Project';
      const id = p.id || '';
      return `${idx + 1}. <b>${name}</b> (ID: <code>${id}</code>)`;
    })
    .join('\n');

  return {
    success: true,
    content: `📁 <b>Your Planka Projects:</b>\n\n${projectList}`,
  };
}

async function handleListBoards(auth: PlankaAuth, projectId: string): Promise<ToolExecutionResult> {
  try {
    console.log('[handleListBoards] Fetching project details for:', projectId);
    const project: any = await getProject(auth, projectId);
    console.log('[handleListBoards] Project response keys:', Object.keys(project));
    
    const projectName = project.item?.name || 'Unknown Project';
    console.log('[handleListBoards] Project name:', projectName);
    
    // Boards are in the included section
    const boards = project.included?.boards || [];
    console.log('[handleListBoards] Boards found:', boards.length);
    if (boards.length > 0) {
      console.log('[handleListBoards] First board:', JSON.stringify(boards[0], null, 2));
    }

    if (boards.length === 0) {
      return {
        success: true,
        content: `No boards found in project "${projectName}".`,
      };
    }

    const boardList = boards
      .map((b: any, idx: number) => {
        const name = b.name || 'Unnamed Board';
        const id = b.id || '';
        console.log(`[handleListBoards] Board ${idx + 1}: ${name} (${id})`);
        return `${idx + 1}. <b>${name}</b> (ID: <code>${id}</code>)`;
      })
      .join('\n');

    console.log('[handleListBoards] Returning board list');
    return {
      success: true,
      content: `📋 <b>Boards in "${projectName}":</b>\n\n${boardList}`,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Failed to list boards',
    };
  }
}

async function handleListLists(auth: PlankaAuth, boardId: string): Promise<ToolExecutionResult> {
  try {
    const board = await getBoard(auth, boardId);
    const boardName = board.item?.name || 'Board';
    const lists = board.included?.lists || [];

    if (lists.length === 0) {
      return {
        success: true,
        content: `No lists found in board "${boardName}".`,
      };
    }

    const listItems = lists
      .map((l: any, idx: number) => {
        const name = l.name || 'Unnamed List';
        const id = l.id || '';
        return `${idx + 1}. <b>${name}</b> (ID: <code>${id}</code>)`;
      })
      .join('\n');

    return {
      success: true,
      content: `📝 <b>Lists in "${boardName}":</b>\n\n${listItems}`,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Failed to list lists',
    };
  }
}

async function handleListCards(
  auth: PlankaAuth,
  boardId: string,
  listId?: string,
): Promise<ToolExecutionResult> {
  try {
    const board = await getBoard(auth, boardId);
    const boardName = board.item?.name || 'Board';

    // Get lists and cards from the board data
    const included = board.included || {};
    const lists = included.lists || [];
    const cards = included.cards || [];

    let filteredCards = cards;
    if (listId) {
      filteredCards = cards.filter((c: any) => c.listId === listId);
    }

    if (filteredCards.length === 0) {
      return {
        success: true,
        content: `No cards found in ${boardName}${listId ? ' (filtered by list)' : ''}.`,
      };
    }

    const cardList = filteredCards
      .map((c: any, idx: number) => {
        const name = c.name || 'Unnamed Card';
        const id = c.id || '';
        const list = lists.find((l: any) => l.id === c.listId);
        const listName = list?.name || 'Unknown List';
        return `${idx + 1}. <b>${name}</b> (${listName})\n   ID: <code>${id}</code>`;
      })
      .join('\n\n');

    return {
      success: true,
      content: `🎴 <b>Cards in ${boardName}:</b>\n\n${cardList}`,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `Failed to list cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function handleCreateCard(
  auth: PlankaAuth,
  listId: string,
  name: string,
  description?: string,
  position?: number,
): Promise<ToolExecutionResult> {
  try {
    const result = await createCard(auth, listId, name, description);
    const card = (result as any).item || result;
    const cardId = card?.id || '';

    return {
      success: true,
      content: `✅ Card created: <b>${name}</b>\nID: <code>${cardId}</code>`,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `Failed to create card: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function handleUpdateCard(
  auth: PlankaAuth,
  cardId: string,
  name?: string,
  description?: string,
): Promise<ToolExecutionResult> {
  try {
    const updates: { name?: string; description?: string } = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    await updateCard(auth, cardId, updates);

    return {
      success: true,
      content: `✅ Card updated successfully${name ? `: <b>${name}</b>` : ''}`,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `Failed to update card: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function handleSearchCards(
  auth: PlankaAuth,
  boardId: string,
  query: string,
): Promise<ToolExecutionResult> {
  try {
    const board = await getBoard(auth, boardId);
    const boardName = board.item?.name || 'Board';
    const cards = board.included?.cards || [];
    const lists = board.included?.lists || [];

    // Filter cards by query
    const q = query.toLowerCase();
    const matchingCards = cards.filter((c: any) => {
      const name = (c.name || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });

    if (matchingCards.length === 0) {
      return {
        success: true,
        content: `No cards found matching "${query}" in ${boardName}.`,
      };
    }

    const cardList = matchingCards
      .map((c: any, idx: number) => {
        const name = c.name || 'Unnamed Card';
        const id = c.id || '';
        const list = lists.find((l: any) => l.id === c.listId);
        const listName = list?.name || 'Unknown List';
        return `${idx + 1}. <b>${name}</b> (${listName})\n   ID: <code>${id}</code>`;
      })
      .join('\n\n');

    return {
      success: true,
      content: `🔍 <b>Search results for "${query}" in ${boardName}:</b>\n\n${cardList}`,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `Failed to search cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
