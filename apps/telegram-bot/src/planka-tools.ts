import { getPlankaToken } from '@rastar/shared';
import {
  type PlankaAuth,
  listProjects,
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
      case 'planka_list_boards':
        return await handleListBoards(auth);

      case 'planka_list_cards':
        return await handleListCards(auth, args.boardId, args.listId);

      case 'planka_create_card':
        return await handleCreateCard(auth, args.listId, args.name, args.description);

      case 'planka_update_card':
        return await handleUpdateCard(auth, args.cardId, args.name, args.description);

      case 'planka_search_cards':
        return await handleSearchCards(auth, args.query);

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

async function handleListBoards(auth: PlankaAuth): Promise<ToolExecutionResult> {
  const projects = await listProjects(auth);

  if (!projects || projects.length === 0) {
    return {
      success: true,
      content: 'No boards found. You may not have access to any boards yet.',
    };
  }

  const boardList = projects
    .map((p: any, idx: number) => {
      const name = p.name || 'Unnamed Board';
      const id = p.id || '';
      return `${idx + 1}. <b>${name}</b> (ID: <code>${id}</code>)`;
    })
    .join('\n');

  return {
    success: true,
    content: `📋 <b>Your Planka Boards:</b>\n\n${boardList}`,
  };
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
  query: string,
): Promise<ToolExecutionResult> {
  try {
    // Get all projects/boards
    const projects = await listProjects(auth);

    const allCards: any[] = [];

    // Search across all boards
    for (const project of projects) {
      try {
        const board = await getBoard(auth, project.id);
        const cards = board.included?.cards || [];
        const lists = board.included?.lists || [];

        // Filter cards by query
        const matchingCards = cards.filter((c: any) => {
          const name = (c.name || '').toLowerCase();
          const desc = (c.description || '').toLowerCase();
          const q = query.toLowerCase();
          return name.includes(q) || desc.includes(q);
        });

        // Add board context
        matchingCards.forEach((c: any) => {
          const list = lists.find((l: any) => l.id === c.listId);
          allCards.push({
            ...c,
            boardName: project.name,
            listName: list?.name || 'Unknown',
          });
        });
      } catch {
        // Skip boards we can't access
        continue;
      }
    }

    if (allCards.length === 0) {
      return {
        success: true,
        content: `🔍 No cards found matching "<b>${query}</b>"`,
      };
    }

    const resultList = allCards
      .slice(0, 10) // Limit to 10 results
      .map((c: any, idx: number) => {
        const name = c.name || 'Unnamed';
        const board = c.boardName || 'Unknown Board';
        const list = c.listName || 'Unknown List';
        return `${idx + 1}. <b>${name}</b>\n   📋 ${board} → ${list}\n   ID: <code>${c.id}</code>`;
      })
      .join('\n\n');

    return {
      success: true,
      content: `🔍 <b>Search results for "${query}":</b>\n\n${resultList}${
        allCards.length > 10 ? `\n\n<i>...and ${allCards.length - 10} more</i>` : ''
      }`,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `Failed to search cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
