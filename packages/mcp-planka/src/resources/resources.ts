export const resources = [
  {
    uri: 'planka://docs/examples',
    name: 'MCP Usage Examples & Documentation',
    description: 'Complete guide with examples for all tools, resources, and prompts',
    mimeType: 'text/markdown',
  },
  {
    uri: 'planka://projects?plankaBaseUrl={baseUrl}&plankaToken={token}',
    name: 'All Projects',
    description: 'List of all accessible Planka projects (requires ?plankaBaseUrl=URL&plankaToken=TOKEN)',
    mimeType: 'application/json',
  },
  {
    uri: 'planka://projects/{projectId}?plankaBaseUrl={baseUrl}&plankaToken={token}',
    name: 'Project Details',
    description: 'Detailed information about a specific project including boards (requires ?plankaBaseUrl=URL&plankaToken=TOKEN)',
    mimeType: 'application/json',
  },
  {
    uri: 'planka://boards/{boardId}?plankaBaseUrl={baseUrl}&plankaToken={token}',
    name: 'Board Details',
    description: 'Board information with lists and cards (requires ?plankaBaseUrl=URL&plankaToken=TOKEN)',
    mimeType: 'application/json',
  },
  {
    uri: 'planka://users/{userId}/assigned-cards?plankaBaseUrl={baseUrl}&plankaToken={token}',
    name: 'User Assigned Cards',
    description: 'All cards assigned to a specific user (requires ?plankaBaseUrl=URL&plankaToken=TOKEN)',
    mimeType: 'application/json',
  },
  {
    uri: 'planka://projects/{projectId}/cards?plankaBaseUrl={baseUrl}&plankaToken={token}',
    name: 'Project Cards',
    description: 'All cards across all boards in a project (requires ?plankaBaseUrl=URL&plankaToken=TOKEN)',
    mimeType: 'application/json',
  },
] as const;
