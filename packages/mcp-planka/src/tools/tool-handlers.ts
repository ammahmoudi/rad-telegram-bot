import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { getSystemConfig } from '@rastar/shared';
import {
  listProjects,
  getProject,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  createList,
  updateList,
  archiveList,
  deleteList,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  assignLabelToCard,
  removeLabelFromCard,
  assignMemberToCard,
  removeMemberFromCard,
  getComments,
  createComment as createCommentApi,
  updateComment,
  deleteComment,
  createTaskList,
  updateTaskList,
  deleteTaskList,
  createTask,
  updateTask,
  deleteTask,
  getAttachments,
  deleteAttachment,
} from '../api/index.js';
import { requireAuth, text as textHelper } from './helpers.js';

type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
};

export async function handleToolCall(request: CallToolRequest): Promise<ToolResponse> {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'planka.auth.status': {
        const plankaBaseUrl = String((args as any)?.plankaBaseUrl ?? '');
        const plankaToken = String((args as any)?.plankaToken ?? '');
        const linked = !!(plankaBaseUrl && plankaToken);
        return textHelper(JSON.stringify({ linked, plankaBaseUrl: plankaBaseUrl || null }, null, 2));
      }

      case 'planka.projects.list': {
        const auth = await requireAuth(args);
        const projects = await listProjects(auth);
        return textHelper(JSON.stringify(projects, null, 2));
      }

      case 'planka.boards.list': {
        const auth = await requireAuth(args);
        const projectId = String((args as any)?.projectId ?? '');
        if (!projectId) throw new Error('projectId is required');
        const proj = await getProject(auth, projectId);
        const boards = (proj as any)?.included?.boards ?? [];
        return textHelper(JSON.stringify(boards, null, 2));
      }

      case 'planka.lists.list': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        if (!boardId) throw new Error('boardId is required');
        const board = await getBoard(auth, boardId);
        const lists = (board as any)?.included?.lists ?? [];
        return textHelper(JSON.stringify(lists, null, 2));
      }

      case 'planka.cards.searchGlobal': {
        const auth = await requireAuth(args);
        const query = String((args as any)?.query ?? '');
        if (!query) throw new Error('query is required');

        // Get all projects
        const projects = await listProjects(auth);
        const allCards: any[] = [];
        const q = query.toLowerCase();
        
        // Normalize query: try both space and dot variations for flexible matching
        const qNormalized = q.replace(/[.\s]+/g, ''); // Remove dots and spaces for comparison

        // Search through all projects and boards
        for (const project of projects) {
          try {
            const boards = (project as any)?.included?.boards ?? [];
            
            for (const board of boards) {
              try {
                const boardData = await getBoard(auth, board.id);
                const cards = (boardData as any)?.included?.cards ?? [];
                const boardMembers = (boardData as any)?.included?.boardMemberships ?? [];
                const users = (boardData as any)?.included?.users ?? [];
                
                // Find member IDs that match the query
                const matchingMemberIds = new Set<string>();
                for (const user of users) {
                  const userName = String(user?.name ?? '').toLowerCase();
                  const userUsername = String(user?.username ?? '').toLowerCase();
                  
                  // Flexible matching: normalize both query and user data (remove dots/spaces)
                  const userNameNormalized = userName.replace(/[.\s]+/g, '');
                  const userUsernameNormalized = userUsername.replace(/[.\s]+/g, '');
                  
                  // Match if query is contained in name/username OR if normalized versions match
                  if (userName.includes(q) || userUsername.includes(q) || 
                      userNameNormalized.includes(qNormalized) || 
                      userUsernameNormalized.includes(qNormalized)) {
                    matchingMemberIds.add(user.id);
                  }
                }
                
                // DEBUG: Log all users in this board
                const debugUsers = users.map((u: any) => ({
                  name: u?.name,
                  username: u?.username,
                  id: u?.id
                }));
                
                // Filter cards matching query (by name/description OR by assigned member)
                const matchingCards = cards.filter((c: any) => {
                  const name = String(c?.name ?? '').toLowerCase();
                  const desc = String(c?.description ?? '').toLowerCase();
                  const textMatch = name.includes(q) || desc.includes(q);
                  
                  // Check if card is assigned to a matching member
                  const memberIds = c?.memberIds ?? [];
                  const memberMatch = memberIds.some((id: string) => matchingMemberIds.has(id));
                  
                  return textMatch || memberMatch;
                });

                // Add context and member info to each card
                matchingCards.forEach((card: any) => {
                  // Get member names for this card
                  const cardMemberNames = (card.memberIds ?? [])
                    .map((memberId: string) => {
                      const user = users.find((u: any) => u.id === memberId);
                      return user?.name || user?.username || memberId;
                    })
                    .filter(Boolean);

                  // Get list name
                  const lists = (boardData as any)?.included?.lists ?? [];
                  const cardList = lists.find((l: any) => l.id === card.listId);
                  const listName = cardList?.name || 'Unknown';

                  allCards.push({
                    id: card.id,
                    name: card.name,
                    description: card.description,
                    dueDate: card.dueDate,
                    position: card.position,
                    listId: card.listId,
                    listName,
                    stopwatch: card.stopwatch,
                    createdAt: card.createdAt,
                    updatedAt: card.updatedAt,
                    project: project.name,
                    projectId: project.id,
                    board: board.name,
                    boardId: board.id,
                    members: cardMemberNames,
                    debugAllBoardUsers: debugUsers,
                  });
                });
              } catch (err) {
                console.error(`Error searching board ${board.id}:`, err);
              }
            }
          } catch (err) {
            console.error(`Error searching project ${project.id}:`, err);
          }
        }

        return textHelper(JSON.stringify({ success: true, cards: allCards, totalFound: allCards.length }, null, 2));
      }

      case 'planka.projects.create':
      case 'planka.projects.update':
      case 'planka.projects.delete':
        throw new Error('Project CRUD operations not yet implemented in API');

      case 'planka.boards.create': {
        const auth = await requireAuth(args);
        const projectId = String((args as any)?.projectId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = Number((args as any)?.position ?? 0);
        if (!projectId || !name) throw new Error('projectId and name are required');
        const result = await createBoard(auth, projectId, name, position);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.boards.update': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position !== undefined ? Number((args as any).position) : undefined;
        if (!boardId) throw new Error('boardId is required');
        const result = await updateBoard(auth, boardId, { name, position });
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.boards.delete': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        if (!boardId) throw new Error('boardId is required');
        await deleteBoard(auth, boardId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.lists.create': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = Number((args as any)?.position ?? 0);
        if (!boardId || !name) throw new Error('boardId and name are required');
        const result = await createList(auth, boardId, name, position);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.lists.update': {
        const auth = await requireAuth(args);
        const listId = String((args as any)?.listId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position !== undefined ? Number((args as any).position) : undefined;
        if (!listId) throw new Error('listId is required');
        const result = await updateList(auth, listId, { name, position });
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.lists.delete': {
        const auth = await requireAuth(args);
        const listId = String((args as any)?.listId ?? '');
        if (!listId) throw new Error('listId is required');
        await deleteList(auth, listId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.lists.archive': {
        const auth = await requireAuth(args);
        const listId = String((args as any)?.listId ?? '');
        if (!listId) throw new Error('listId is required');
        const result = await archiveList(auth, listId);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.cards.list': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const listId = String((args as any)?.listId);
        
        if (!boardId) throw new Error('boardId is required');
        
        // Get board data with included cards
        const boardData = await getBoard(auth, boardId);
        const cards = (boardData as any)?.included?.cards ?? [];
        const lists = (boardData as any)?.included?.lists ?? [];
        const users = (boardData as any)?.included?.users ?? [];
        const boardMemberships = (boardData as any)?.included?.boardMemberships ?? [];
        const cardMemberships = (boardData as any)?.included?.cardMemberships ?? [];
        
        // Filter by listId if provided
        let filteredCards = cards;
        if (listId) {
          filteredCards = cards.filter((c: any) => c.listId === listId);
        }
        
        // Enrich cards with list names and member names
        const enrichedCards = filteredCards.map((card: any) => {
          const list = lists.find((l: any) => l.id === card.listId);
          const cardMembers = cardMemberships.filter((cm: any) => cm.cardId === card.id);
          const memberNames = cardMembers
            .map((cm: any) => {
              const user = users.find((u: any) => u.id === cm.userId);
              return user ? user.name || user.username : null;
            })
            .filter(Boolean);
          
          return {
            id: card.id,
            name: card.name,
            description: card.description,
            dueDate: card.dueDate,
            position: card.position,
            listId: card.listId,
            listName: list?.name || 'Unknown',
            stopwatch: card.stopwatch,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
            memberIds: cardMembers.map((cm: any) => cm.userId),
            members: memberNames,
          };
        });
        
        return textHelper(JSON.stringify({ 
          success: true, 
          cards: enrichedCards, 
          totalFound: enrichedCards.length 
        }, null, 2));
      }

      case 'planka.cards.search': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const query = String((args as any)?.query ?? '').toLowerCase();
        
        if (!boardId || !query) throw new Error('boardId and query are required');
        
        // Get board data
        const boardData = await getBoard(auth, boardId);
        const cards = (boardData as any)?.included?.cards ?? [];
        const lists = (boardData as any)?.included?.lists ?? [];
        const users = (boardData as any)?.included?.users ?? [];
        const cardMemberships = (boardData as any)?.included?.cardMemberships ?? [];
        
        // Search cards by name or description
        const matchingCards = cards.filter((c: any) => {
          const nameMatch = (c.name || '').toLowerCase().includes(query);
          const descMatch = (c.description || '').toLowerCase().includes(query);
          return nameMatch || descMatch;
        });
        
        // Enrich with list names and member names
        const enrichedCards = matchingCards.map((card: any) => {
          const list = lists.find((l: any) => l.id === card.listId);
          const cardMembers = cardMemberships.filter((cm: any) => cm.cardId === card.id);
          const memberNames = cardMembers
            .map((cm: any) => {
              const user = users.find((u: any) => u.id === cm.userId);
              return user ? user.name || user.username : null;
            })
            .filter(Boolean);
          
          return {
            id: card.id,
            name: card.name,
            description: card.description,
            dueDate: card.dueDate,
            position: card.position,
            listId: card.listId,
            listName: list?.name || 'Unknown',
            stopwatch: card.stopwatch,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
            memberIds: cardMembers.map((cm: any) => cm.userId),
            members: memberNames,
          };
        });
        
        return textHelper(JSON.stringify({ 
          success: true, 
          cards: enrichedCards, 
          totalFound: enrichedCards.length 
        }, null, 2));
      }

      case 'planka.cards.create': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const listId = String((args as any)?.listId ?? '');
        const name = String((args as any)?.name ?? '');
        const description = String((args as any)?.description ?? '');
        const position = Number((args as any)?.position ?? 0);
        if (!listId || !name) throw new Error('listId and name are required');
        const result = await createCard(auth, listId, name, description, position);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.cards.update': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        if (!cardId) throw new Error('cardId is required');
        
        const updates: any = {};
        if ((args as any)?.name !== undefined) updates.name = String((args as any).name);
        if ((args as any)?.description !== undefined) updates.description = String((args as any).description);
        if ((args as any)?.dueDate !== undefined) updates.dueDate = String((args as any).dueDate);
        if ((args as any)?.position !== undefined) updates.position = Number((args as any).position);
        
        const result = await updateCard(auth, cardId, updates);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.cards.delete': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        if (!cardId) throw new Error('cardId is required');
        await deleteCard(auth, cardId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.cards.move': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const listId = String((args as any)?.listId ?? '');
        const position = (args as any)?.position !== undefined ? Number((args as any).position) : undefined;
        if (!cardId || !listId) throw new Error('cardId and listId are required');
        const result = await moveCard(auth, cardId, listId, position);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.labels.create': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const name = String((args as any)?.name ?? '');
        const color = String((args as any)?.color ?? 'blue-cerulean');
        if (!boardId || !name) throw new Error('boardId and name are required');
        const result = await createLabel(auth, boardId, name, color);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.labels.update': {
        const auth = await requireAuth(args);
        const labelId = String((args as any)?.labelId ?? '');
        const name = String((args as any)?.name ?? '');
        const color = String((args as any)?.color ?? '');
        if (!labelId) throw new Error('labelId is required');
        const result = await updateLabel(auth, labelId, { name, color });
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.labels.delete': {
        const auth = await requireAuth(args);
        const labelId = String((args as any)?.labelId ?? '');
        if (!labelId) throw new Error('labelId is required');
        await deleteLabel(auth, labelId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.labels.list': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        if (!boardId) throw new Error('boardId is required');
        const labels = await getLabels(auth, boardId);
        return textHelper(JSON.stringify({ success: true, labels }, null, 2));
      }

      case 'planka.labels.assignToCard': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const labelId = String((args as any)?.labelId ?? '');
        if (!cardId || !labelId) throw new Error('cardId and labelId are required');
        const result = await assignLabelToCard(auth, cardId, labelId);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.labels.removeFromCard': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const labelId = String((args as any)?.labelId ?? '');
        if (!cardId || !labelId) throw new Error('cardId and labelId are required');
        const result = await removeLabelFromCard(auth, cardId, labelId);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.members.assignToCard':
      case 'planka.members.addToCard': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const userId = String((args as any)?.userId ?? '');
        if (!cardId || !userId) throw new Error('cardId and userId are required');
        const result = await assignMemberToCard(auth, cardId, userId);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.members.removeFromCard': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const userId = String((args as any)?.userId ?? '');
        if (!cardId || !userId) throw new Error('cardId and userId are required');
        await removeMemberFromCard(auth, cardId, userId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.members.list': {
        const auth = await requireAuth(args);
        const projectId = String((args as any)?.projectId ?? '');
        
        if (!projectId) throw new Error('projectId is required');
        
        const project = await getProject(auth, projectId);
        const members = (project as any)?.included?.users ?? [];
        return textHelper(JSON.stringify({ success: true, members }, null, 2));
      }

      case 'planka.members.addToBoard':
      case 'planka.members.removeFromBoard':
        throw new Error('Board member operations not yet implemented in API');

      case 'planka.comments.create':
      case 'planka.comments.add': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const commentText = String((args as any)?.text ?? '');
        if (!cardId || !commentText) throw new Error('cardId and text are required');
        const result = await createCommentApi(auth, cardId, commentText);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.comments.list': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        if (!cardId) throw new Error('cardId is required');
        const comments = await getComments(auth, cardId);
        return textHelper(JSON.stringify({ success: true, comments }, null, 2));
      }

      case 'planka.comments.update': {
        const auth = await requireAuth(args);
        const commentId = String((args as any)?.commentId ?? '');
        const textContent = String((args as any)?.text ?? '');
        if (!commentId || !textContent) throw new Error('commentId and text are required');
        const result = await updateComment(auth, commentId, textContent);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.comments.delete': {
        const auth = await requireAuth(args);
        const commentId = String((args as any)?.commentId ?? '');
        if (!commentId) throw new Error('commentId is required');
        await deleteComment(auth, commentId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.taskLists.create': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position !== undefined ? Number((args as any).position) : undefined;
        if (!cardId || !name) throw new Error('cardId and name are required');
        const result = await createTaskList(auth, cardId, name, position);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.taskLists.update': {
        const auth = await requireAuth(args);
        const taskListId = String((args as any)?.taskListId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position !== undefined ? Number((args as any).position) : undefined;
        if (!taskListId) throw new Error('taskListId is required');
        const result = await updateTaskList(auth, taskListId, { name, position });
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.taskLists.delete': {
        const auth = await requireAuth(args);
        const taskListId = String((args as any)?.taskListId ?? '');
        if (!taskListId) throw new Error('taskListId is required');
        await deleteTaskList(auth, taskListId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.tasks.create': {
        const auth = await requireAuth(args);
        const taskListId = String((args as any)?.taskListId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position !== undefined ? Number((args as any).position) : undefined;
        if (!taskListId || !name) throw new Error('taskListId and name are required');
        const result = await createTask(auth, taskListId, name, position);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.tasks.update': {
        const auth = await requireAuth(args);
        const taskId = String((args as any)?.taskId ?? '');
        if (!taskId) throw new Error('taskId is required');
        
        const updates: any = {};
        if ((args as any)?.name !== undefined) updates.name = String((args as any).name);
        if ((args as any)?.isCompleted !== undefined) updates.isCompleted = Boolean((args as any).isCompleted);
        if ((args as any)?.position !== undefined) updates.position = Number((args as any).position);
        
        const result = await updateTask(auth, taskId, updates);
        return textHelper(JSON.stringify(result, null, 2));
      }

      case 'planka.tasks.delete': {
        const auth = await requireAuth(args);
        const taskId = String((args as any)?.taskId ?? '');
        if (!taskId) throw new Error('taskId is required');
        await deleteTask(auth, taskId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.attachments.list': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        if (!cardId) throw new Error('cardId is required');
        const attachments = await getAttachments(auth, cardId);
        return textHelper(JSON.stringify({ success: true, attachments }, null, 2));
      }

      case 'planka.attachments.add':
        throw new Error('Attachment upload not yet implemented in API');

      case 'planka.attachments.delete': {
        const auth = await requireAuth(args);
        const attachmentId = String((args as any)?.attachmentId ?? '');
        if (!attachmentId) throw new Error('attachmentId is required');
        await deleteAttachment(auth, attachmentId);
        return textHelper(JSON.stringify({ success: true }, null, 2));
      }

      case 'planka.users.listAll': {
        const auth = await requireAuth(args);
        
        // Get configuration for project scanning limits from args
        const projects = await listProjects(auth);
        const scanLimit = (args as any)?.maxProjects || Math.min(5, projects.length);
        const projectsToScan = projects.slice(0, scanLimit);
        
        // Get delay between requests (default 100ms)
        const delay = (args as any)?.delayMs || 100;
        
        const allUsers = new Map<string, any>();
        let totalBoards = 0;
        
        for (const project of projectsToScan) {
          try {
            const boards = (project as any)?.included?.boards ?? [];
            
            for (const board of boards) {
              try {
                const boardData = await getBoard(auth, board.id);
                const users = (boardData as any)?.included?.users ?? [];
                totalBoards++;
                
                // Add users to map (dedup by ID)
                for (const user of users) {
                  if (!allUsers.has(user.id)) {
                    allUsers.set(user.id, {
                      id: user.id,
                      name: user.name,
                      username: user.username,
                      email: user.email,
                      isAdmin: user.isAdmin,
                    });
                  }
                }
                
                // Add delay between board requests
                if (delay > 0) {
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              } catch (err) {
                console.error(`Error scanning board ${board.id}:`, err);
              }
            }
          } catch (err) {
            console.error(`Error scanning project ${project.id}:`, err);
          }
        }
        
        return textHelper(JSON.stringify({
          success: true,
          totalUsers: allUsers.size,
          processedProjects: projectsToScan.length,
          totalProjects: projects.length,
          totalBoards,
          users: Array.from(allUsers.values()),
        }, null, 2));
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return textHelper(JSON.stringify({ error: error?.message ?? String(error) }, null, 2));
  }
}
