# Planka API Enhancement Request

## Overview
This document specifies new REST API endpoints for Planka to support efficient search, filtering, and user activity tracking. These APIs will reduce the number of API calls from 20-50+ down to 1-3 per query.

---

## API Endpoints

### 1. Get Cards (Global)

**Endpoint**: `GET /api/cards`

Get all cards with comprehensive filtering and sorting. Can filter by user, project, board, list, or get all cards. When filtering by text-based criteria, searches across card name (title), description, and comments.

**Query Parameters**:
- `userId` (optional): Filter by cards created by or assigned to specific user. Use `me` for current user
- `createdByUserId` (optional): Filter only by cards created by user
- `assignedToUserId` (optional): Filter only by cards assigned to user
- `startDate` (optional): Filter cards created/updated after this date. Format: `YYYY-MM-DD`
- `endDate` (optional): Filter cards created/updated before this date. Format: `YYYY-MM-DD`
- `status` (optional): `done`, `not_done`, `overdue`, `active`, `archived` (default: `active`)
- `projectId` (optional): Filter by project
- `boardId` (optional): Filter by board
- `listId` (optional): Filter by list
- `labelIds` (optional): Comma-separated label IDs to filter by
- `sortBy` (optional): `dueDate`, `createdAt`, `updatedAt`, `position`, `name` (default: `dueDate`)
- `sortOrder` (optional): `asc` or `desc` (default: `asc`)
- `limit` (optional): Max results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "cards": [
    {
      "id": "card123",
      "name": "Implement authentication",
      "description": "Add OAuth2 support",
      "dueDate": "2025-12-25T10:00:00Z",
      "position": 1,
      "isCompleted": false,
      "isOverdue": true,
      "createdBy": {
        "id": "user123",
        "username": "john.doe",
        "name": "John Doe"
      },
      "assignedUsers": [
        { "id": "user456", "username": "jane.doe", "name": "Jane Doe" }
      ],
      "labels": [
        { "id": "lbl1", "name": "urgent", "color": "red" }
      ],
      "list": { "id": "list456", "name": "In Progress", "position": 2 },
      "board": { "id": "board789", "name": "Backend Services" },
      "project": { "id": "proj123", "name": "Main Project" },
      "tasks": {
        "total": 5,
        "completed": 2,
        "percentage": 40,
        "items": [
          {
            "id": "task1",
            "name": "Set up OAuth provider",
            "isCompleted": true,
            "position": 1
          },
          {
            "id": "task2",
            "name": "Implement token validation",
            "isCompleted": true,
            "position": 2
          },
          {
            "id": "task3",
            "name": "Add refresh token logic",
            "isCompleted": false,
            "position": 3
          },
          {
            "id": "task4",
            "name": "Write tests",
            "isCompleted": false,
            "position": 4
          },
          {
            "id": "task5",
            "name": "Update documentation",
            "isCompleted": false,
            "position": 5
          }
        ]
      },
      "createdAt": "2025-12-20T08:00:00Z",
      "updatedAt": "2025-12-30T14:30:00Z"
    }
  ],
  "summary": {
    "total": 15,
    "done": 8,
    "notDone": 5,
    "overdue": 2
  },
  "pagination": {
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 2. Search Users

**Endpoint**: `GET /api/users/search`

**Query Parameters**:
- `q` (required): Search query (min 2 characters)
- `limit` (optional): Max results (default: 20)

**Response**:
```json
{
  "users": [
    {
      "id": "user123",
      "username": "john.doe",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://...",
      "isActive": true
    }
  ],
  "total": 5
}
```

---

### 3. Search Projects

**Endpoint**: `GET /api/projects/search`

**Query Parameters**:
- `q` (required): Search query (min 2 characters)
- `limit` (optional): Max results (default: 20)

**Response**:
```json
{
  "projects": [
    {
      "id": "proj123",
      "name": "Main Project",
      "description": "Primary development project",
      "type": "private",
      "boardsCount": 5,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 3
}
```

---

### 4. Search Boards

**Endpoint**: `GET /api/boards/search`

**Query Parameters**:
- `q` (required): Search query (min 2 characters)
- `projectId` (optional): Filter by project
- `limit` (optional): Max results (default: 20)

**Response**:
```json
{
  "boards": [
    {
      "id": "board123",
      "name": "Backend Services",
      "position": 1,
      "project": { "id": "proj123", "name": "Main Project" },
      "listsCount": 4,
      "cardsCount": 25,
      "createdAt": "2025-01-15T00:00:00Z"
    }
  ],
  "total": 2
}
```

---

### 5. Search Lists

**Endpoint**: `GET /api/lists/search`

**Query Parameters**:
- `q` (required): Search query (min 2 characters)
- `boardId` (optional): Filter by board
- `projectId` (optional): Filter by project
- `limit` (optional): Max results (default: 20)

**Response**:
```json
{
  "lists": [
    {
      "id": "list123",
      "name": "In Progress",
      "position": 2,
      "board": { "id": "board123", "name": "Backend Services" },
      "project": { "id": "proj123", "name": "Main Project" },
      "cardsCount": 8,
      "createdAt": "2025-01-20T00:00:00Z"
    }
  ],
  "total": 4
}
```

---

### 6. Search Cards

**Endpoint**: `GET /api/cards/search`

Search cards by name (title), description, or comments content.

**Query Parameters**:
- `q` (required): Search query (min 2 characters). Searches across card name, description, and all comments
- `projectId` (optional): Filter by project
- `boardId` (optional): Filter by board
- `listId` (optional): Filter by list
- `assignedToUserId` (optional): Filter by assigned user
- `status` (optional): `done`, `not_done`, `overdue`, `active`
- `limit` (optional): Max results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "cards": [
    {
      "id": "card123",
      "name": "Implement authentication",
      "description": "Add OAuth2 support...",
      "dueDate": "2025-12-25T10:00:00Z",
      "isCompleted": false,
      "isOverdue": true,
      "matchedIn": ["name", "description"],
      "assignedUsers": [
        { "id": "user123", "username": "john.doe", "name": "John Doe" }
      ],
      "labels": [
        { "id": "lbl1", "name": "urgent", "color": "red" }
      ],
      "list": { "id": "list456", "name": "In Progress" },
      "board": { "id": "board789", "name": "Backend Services" },
      "project": { "id": "proj123", "name": "Main Project" },
      "tasks": {
        "total": 3,
        "completed": 1,
        "percentage": 33,
        "items": [
          {
            "id": "task1",
            "name": "Research OAuth providers",
            "isCompleted": true,
            "position": 1
          },
          {
            "id": "task2",
            "name": "Implement OAuth flow",
            "isCompleted": false,
            "position": 2
          },
          {
            "id": "task3",
            "name": "Test with different providers",
            "isCompleted": false,
            "position": 3
          }
        ]
      },
      "createdAt": "2025-12-20T08:00:00Z",
      "updatedAt": "2025-12-30T14:30:00Z"
    }
  ],
  "total": 12,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 7. Global Search

**Endpoint**: `GET /api/search`

Search across all entities (projects, boards, lists, cards, users).

**Query Parameters**:
- `q` (required): Search query (min 2 characters)
- `types` (optional): Comma-separated types - `projects,boards,lists,cards,users` (default: all)
- `limit` (optional): Max results per type (default: 10)

**Response**:
```json
{
  "query": "authentication",
  "results": {
    "projects": [
      { "id": "proj123", "name": "Auth Service", "description": "Authentication microservice" }
    ],
    "boards": [
      {
        "id": "board456",
        "name": "Authentication",
        "project": { "id": "proj123", "name": "Auth Service" }
      }
    ],
    "lists": [],
    "cards": [
      {
        "id": "card789",
        "name": "Implement OAuth2",
        "project": { "id": "proj123", "name": "Auth Service" },
        "board": { "id": "board456", "name": "Authentication" },
        "list": { "id": "list123", "name": "In Progress" }
      }
    ],
    "users": [
      { "id": "user321", "username": "auth.admin", "name": "Auth Admin" }
    ]
  },
  "totalResults": 5
}
```

---

### 8. Get Entity History

**Endpoint**: `GET /api/history`

Get movement history and major changes for any entity (card, list, board, or project).

**Query Parameters**:
- `entityType` (required): Type of entity - `card`, `list`, `board`, `project`
- `entityId` (required): ID of the entity
- `types` (optional): Comma-separated action types - `move,create,update,comment,delete` (default: all)
- `limit` (optional): Max results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "entityType": "card",
  "entityId": "card123",
  "entityName": "Implement authentication",
  "history": [
    {
      "id": "action789",
      "type": "move",
      "data": {
        "fromList": { "id": "list1", "name": "To Do" },
        "toList": { "id": "list2", "name": "In Progress" }
      },
      "user": { "id": "user123", "username": "john.doe", "name": "John Doe" },
      "createdAt": "2025-12-25T10:00:00Z"
    },
    {
      "id": "action790",
      "type": "update",
      "data": {
        "field": "dueDate",
        "oldValue": "2025-12-20T00:00:00Z",
        "newValue": "2025-12-25T00:00:00Z"
      },
      "user": { "id": "user456", "username": "jane.doe", "name": "Jane Doe" },
      "createdAt": "2025-12-24T14:30:00Z"
    },
    {
      "id": "action791",
      "type": "comment",
      "data": { "text": "Updated the implementation approach" },
      "user": { "id": "user123", "username": "john.doe", "name": "John Doe" },
      "createdAt": "2025-12-23T09:15:00Z"
    }
  ],
  "total": 15,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 9. Get User Actions

**Endpoint**: `GET /api/users/me/actions` or `GET /api/users/{userId}/actions`

Get all actions performed by a user.

**Query Parameters**:
- `types` (optional): Comma-separated types - `create,update,move,comment,assign,delete` (default: all)
- `projectId` (optional): Filter by project
- `boardId` (optional): Filter by board
- `listId` (optional): Filter by list
- `cardId` (optional): Filter by card
- `startDate` (optional): Filter after this date. Format: `YYYY-MM-DD`
- `endDate` (optional): Filter before this date. Format: `YYYY-MM-DD`
- `limit` (optional): Max results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "userId": "user123",
  "username": "john.doe",
  "name": "John Doe",
  "actions": [
    {
      "id": "action123",
      "type": "create",
      "entity": "card",
      "data": {
        "card": { "id": "card456", "name": "New feature" },
        "list": { "id": "list789", "name": "Backlog" }
      },
      "project": { "id": "proj123", "name": "Main Project" },
      "board": { "id": "board456", "name": "Backend Services" },
      "createdAt": "2025-12-30T15:30:00Z"
    },
    {
      "id": "action124",
      "type": "move",
      "entity": "card",
      "data": {
        "card": { "id": "card123", "name": "Implement authentication" },
        "fromList": { "id": "list1", "name": "To Do" },
        "toList": { "id": "list2", "name": "In Progress" }
      },
      "project": { "id": "proj123", "name": "Main Project" },
      "board": { "id": "board456", "name": "Backend Services" },
      "createdAt": "2025-12-30T14:20:00Z"
    }
  ],
  "summary": {
    "totalActions": 45,
    "byType": {
      "create": 12,
      "update": 18,
      "move": 8,
      "comment": 5,
      "assign": 2
    }
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 10. Get User Notifications

**Endpoint**: `GET /api/users/me/notifications`

Get notifications for the current user with full context.

**Query Parameters**:
- `unreadOnly` (optional): Only unread notifications (boolean, default: false)
- `types` (optional): Comma-separated notification types - `card_assigned,card_comment,card_mention,card_due` (default: all)
- `projectId` (optional): Filter by project
- `boardId` (optional): Filter by board
- `listId` (optional): Filter by list
- `cardId` (optional): Filter by card
- `limit` (optional): Max results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "notifications": [
    {
      "id": "notif123",
      "type": "card_assigned",
      "isRead": false,
      "card": {
        "id": "card456",
        "name": "Review PR #123",
        "dueDate": "2025-12-31T18:00:00Z"
      },
      "list": { "id": "list789", "name": "Code Review" },
      "board": { "id": "board123", "name": "Backend Services" },
      "project": { "id": "proj456", "name": "Main Project" },
      "triggeredBy": { "id": "user789", "username": "jane.doe", "name": "Jane Doe" },
      "createdAt": "2025-12-30T16:45:00Z"
    },
    {
      "id": "notif124",
      "type": "card_comment",
      "isRead": true,
      "card": { "id": "card123", "name": "Implement authentication" },
      "comment": { "id": "comment456", "text": "Great work on this!" },
      "list": { "id": "list2", "name": "In Progress" },
      "board": { "id": "board456", "name": "Backend Services" },
      "project": { "id": "proj123", "name": "Main Project" },
      "triggeredBy": { "id": "user321", "username": "manager", "name": "Project Manager" },
      "createdAt": "2025-12-30T12:30:00Z"
    }
  ],
  "summary": {
    "total": 25,
    "unread": 5
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 11. Get Combined Activity Feed

**Endpoint**: `GET /api/users/me/feed`

Get combined notifications and activity actions in a single timeline.

**Query Parameters**:
- `includeActions` (optional): Include user's own actions (boolean, default: true)
- `includeNotifications` (optional): Include notifications (boolean, default: true)
- `unreadOnly` (optional): Only unread items (boolean, default: false)
- `types` (optional): Comma-separated types - `create,update,move,comment,assign,notification` (default: all)
- `projectId` (optional): Filter by project
- `boardId` (optional): Filter by board
- `listId` (optional): Filter by list
- `cardId` (optional): Filter by card
- `startDate` (optional): Filter after this date. Format: `YYYY-MM-DD`
- `endDate` (optional): Filter before this date. Format: `YYYY-MM-DD`
- `limit` (optional): Max results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "userId": "user123",
  "username": "john.doe",
  "name": "John Doe",
  "feed": [
    {
      "id": "notif123",
      "type": "notification",
      "subType": "card_assigned",
      "isRead": false,
      "card": {
        "id": "card456",
        "name": "Review PR #123",
        "dueDate": "2025-12-31T18:00:00Z"
      },
      "list": { "id": "list789", "name": "Code Review" },
      "board": { "id": "board123", "name": "Backend Services" },
      "project": { "id": "proj456", "name": "Main Project" },
      "triggeredBy": { "id": "user789", "username": "jane.doe", "name": "Jane Doe" },
      "createdAt": "2025-12-30T16:45:00Z"
    },
    {
      "id": "action124",
      "type": "action",
      "subType": "move",
      "entity": "card",
      "data": {
        "card": { "id": "card123", "name": "Implement authentication" },
        "fromList": { "id": "list1", "name": "To Do" },
        "toList": { "id": "list2", "name": "In Progress" }
      },
      "project": { "id": "proj123", "name": "Main Project" },
      "board": { "id": "board456", "name": "Backend Services" },
      "createdAt": "2025-12-30T14:20:00Z"
    },
    {
      "id": "action125",
      "type": "action",
      "subType": "comment",
      "entity": "card",
      "data": {
        "card": { "id": "card789", "name": "Bug fix" },
        "comment": { "id": "comment123", "text": "Fixed the issue" }
      },
      "project": { "id": "proj123", "name": "Main Project" },
      "board": { "id": "board456", "name": "Backend Services" },
      "createdAt": "2025-12-30T11:15:00Z"
    }
  ],
  "summary": {
    "total": 45,
    "unread": 5,
    "actions": 30,
    "notifications": 15
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## Implementation Guidelines

### Date Handling
- Accept standard Gregorian date format: `YYYY-MM-DD`
- All timestamps in ISO 8601 format with UTC timezone: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Store all dates in UTC

### Search Behavior
- Case-insensitive matching for all text searches
- Partial matching (contains) for names and descriptions
- Minimum query length: 2 characters
- Trim whitespace from search queries
- **Card search** searches across: card name (title), description text, and all comment content
- Return `matchedIn` array indicating where matches were found: `["name"]`, `["description"]`, `["comments"]`, or combinations
- **Card search** includes: card name/title, description, and all comment text
- Return `matchedIn` field indicating where match was found: `["name", "description", "comments"]`

### Performance
- Add database indexes on frequently searched fields (name, description, userId, dates)
- Use pagination for all list endpoints (default limit: 50-100)
- Implement server-side filtering to minimize data transfer
- Consider caching for frequently accessed data (user permissions, project lists)
- Optimize joins to avoid N+1 queries

### Permissions
- All endpoints respect user permissions (only return accessible data)
- Filter results based on project/board membership
- Use existing Planka permission middleware
- `/me` endpoints automatically use current authenticated user

### Error Handling
- `400 Bad Request`: Invalid parameters (missing required, invalid format, etc.)
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User lacks permission to access resource
- `404 Not Found`: Entity (card, user, project) doesn't exist
- `422 Unprocessable Entity`: Valid format but business logic error
- Return descriptive error messages in JSON format:
  ```json
  {
    "error": "Invalid date format",
    "message": "Date must be in YYYY-MM-DD or jYYYY-jMM-jDD format",
    "code": "INVALID_DATE_FORMAT"
  }
  ```

### Response Format Standards
- Consistent JSON structure across all endpoints
- Include metadata: `total`, `pagination`, `summary` where relevant
- Enrich responses with related entities to avoid additional API calls
- Use nested objects for relationships (project → board → list → card)
- Include user details (id, username, name) for all user references
- Boolean flags for common checks: `isOverdue`, `isCompleted`, `isRead`
- **Always include full tasks array** in card responses with `items` containing all task details

### Status Calculation
- **`done`**: Card has all tasks completed (100%) or marked as done
- **`not_done`**: Card has incomplete tasks or not marked as done
- **`overdue`**: Card has dueDate in the past and is not done
- **`active`**: Not archived (default filter for most queries)

### Sorting Options
- **`dueDate`**: Sort by due date (nulls last)
- **`createdAt`**: Sort by creation timestamp
- **`updatedAt`**: Sort by last update timestamp
- **`position`**: Sort by position within list (natural order)
- **`name`**: Alphabetical sort
- Support both `asc` and `desc` order

---

## Priority Ranking

**🔴 HIGH PRIORITY** (Replaces 20+ API calls):
1. `GET /api/cards` - Global cards with filtering (**21 API calls → 1**)
2. `GET /api/cards/search` - Card search (**21 API calls → 1**)
3. `GET /api/search` - Global search (**30+ API calls → 1**)
4. `GET /api/users/me/feed` - Combined activity feed (**40+ API calls → 1**)

**🟡 MEDIUM PRIORITY** (Frequently used):
5. `GET /api/users/{userId}/actions` - User actions
6. `GET /api/{entity}/{id}/history` - Entity history (cards, boards, projects, lists)
7. `GET /api/users/me/notifications` - User notifications

**🟢 LOW PRIORITY** (Nice to have):
8. `GET /api/users/search` - User search
9. `GET /api/projects/search` - Project search
10. `GET /api/boards/search` - Board search
11. `GET /api/lists/search` - List search
