/**
 * API Schema Generator
 * 
 * Dynamically discovers all API functions and generates OpenAPI-like schema
 * by analyzing function signatures and making test calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { PlankaAuth } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface APISchema {
  name: string;
  module: string;
  category: 'create' | 'read' | 'update' | 'delete' | 'other';
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  requestExample?: any;
  responseExample?: any;
  endpoint?: string;
  method?: string;
  error?: string;
}

function categorizeAPI(funcName: string): 'create' | 'read' | 'update' | 'delete' | 'other' {
  const name = funcName.toLowerCase();
  if (name.startsWith('create')) return 'create';
  if (name.startsWith('delete') || name.includes('remove')) return 'delete';
  if (name.startsWith('update') || name.startsWith('archive') || name.includes('assign')) return 'update';
  if (name.startsWith('get') || name.startsWith('list')) return 'read';
  return 'other';
}

async function authenticate(baseUrl: string, emailOrUsername: string, password: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/access-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password }),
  });

  const data = await response.json();
  
  // Handle terms acceptance requirement
  if (response.status === 403 && data.step === 'accept-terms' && data.pendingToken) {
    console.log('⚠️  Terms acceptance required. Accepting terms...');
    
    // Accept terms using the pending token in the body
    const acceptResponse = await fetch(`${baseUrl}/api/access-tokens/accept-terms`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pendingToken: data.pendingToken,
        signature: 'a'.repeat(64) // Minimum 64 characters required for signature
      })
    });
    
    if (!acceptResponse.ok) {
      const errorText = await acceptResponse.text();
      throw new Error(`Terms acceptance failed (${acceptResponse.status}): ${errorText}`);
    }
    
    const acceptData = await acceptResponse.json();
    console.log('✅ Terms accepted\n');
    return acceptData.item;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Authentication failed (${response.status}): ${text}`);
  }

  return data.item;
}

async function discoverAPIModules(): Promise<string[]> {
  const apiDir = path.join(__dirname, 'src', 'api');
  const files = fs.readdirSync(apiDir);
  
  return files
    .filter(file => file.endsWith('.ts') && !file.includes('test') && file !== 'client.ts' && file !== 'index.ts')
    .map(file => file.replace('.ts', ''));
}

async function extractFunctionInfo(moduleName: string): Promise<APISchema[]> {
  const modulePath = `./dist/api/${moduleName}.js`;
  const module = await import(modulePath);
  
  const schemas: APISchema[] = [];
  
  for (const [funcName, func] of Object.entries(module)) {
    if (typeof func === 'function') {
      // Parse function to extract parameter info
      const funcStr = func.toString();
      const paramsMatch = funcStr.match(/\(([^)]*)\)/);
      
      const params: Array<{ name: string; type: string; required: boolean }> = [];
      
      if (paramsMatch && paramsMatch[1]) {
        const paramsList = paramsMatch[1].split(',').map(p => p.trim());
        for (const param of paramsList) {
          const paramName = param.split(':')[0].trim();
          const hasDefault = param.includes('?') || param.includes('=');
          
          // Skip 'auth' parameter as it's always required
          if (paramName && paramName !== 'auth') {
            params.push({
              name: paramName,
              type: 'string', // Default to string, could be enhanced
              required: !hasDefault
            });
          }
        }
      }
      
      schemas.push({
        name: funcName,
        module: moduleName,
        category: categorizeAPI(funcName),
        parameters: params,
      });
    }
  }
  
  return schemas;
}

async function testAPIWithRealData(
  auth: PlankaAuth,
  schema: APISchema,
  testData: any,
  createdResources: Record<string, string>
): Promise<APISchema> {
  try {
    const modulePath = `./dist/api/${schema.module}.js`;
    const module = await import(modulePath);
    const func = module[schema.name];
    
    if (!func) {
      schema.error = 'Function not found';
      return schema;
    }
    
    // Build arguments based on the function and test data
    const args: any[] = [auth];
    
    // Add test data arguments
    for (const param of schema.parameters) {
      if (testData[param.name]) {
        args.push(testData[param.name]);
      } else if (param.required) {
        // Skip this API if we don't have required test data
        schema.error = `Missing required test data: ${param.name}`;
        return schema;
      }
    }
    
    // Call the function
    console.log(`   Testing ${schema.module}.${schema.name}...`);
    const result = await func(...args);
    
    schema.responseExample = result;
    schema.requestExample = { args: args.slice(1) }; // Exclude auth
    
  } catch (error: any) {
    schema.error = error.message;
  }
  
  return schema;
}

async function generateSchemas() {
  const PLANKA_BASE_URL = 'https://pm-dev.rastar.dev';
  const USERNAME = 'am_mahmoudi';
  const PASSWORD = 'Helia@24081379';

  console.log('🔐 Authenticating...');
  const accessToken = await authenticate(PLANKA_BASE_URL, USERNAME, PASSWORD);
  console.log('✅ Authenticated\n');

  const auth: PlankaAuth = {
    plankaBaseUrl: PLANKA_BASE_URL,
    accessToken,
  };

  console.log('🔍 Discovering API modules...');
  const modules = await discoverAPIModules();
  console.log(`   Found ${modules.length} API modules: ${modules.join(', ')}\n`);

  console.log('📝 Extracting function signatures...');
  const allSchemas: APISchema[] = [];
  
  for (const moduleName of modules) {
    const schemas = await extractFunctionInfo(moduleName);
    allSchemas.push(...schemas);
  }
  
  console.log(`   Found ${allSchemas.length} API functions\n`);

  // Sort schemas by category: create → read → update → delete
  const categoryOrder = { create: 1, read: 2, update: 3, delete: 4, other: 5 };
  allSchemas.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);

  console.log('🧪 Testing APIs with real data (in order: Create → Read → Update → Delete)...');
  
  // Import APIs
  const { createProject, deleteProject } = await import('./dist/api/projects.js');
  const { createBoard, deleteBoard } = await import('./dist/api/boards.js');
  const { createList, deleteList } = await import('./dist/api/lists.js');
  const { createCard, deleteCard } = await import('./dist/api/cards.js');
  const { createLabel, deleteLabel } = await import('./dist/api/labels.js');
  const { createTaskList, createTask, deleteTask, deleteTaskList } = await import('./dist/api/tasks.js');
  
  // Create a new test project (so we have full admin rights)
  console.log('   📦 Creating test project...');
  const testProject = await createProject(auth, '[SCHEMA_TEST] Project', 'Temporary test project for schema generation');
  const projectId = testProject.item?.id || testProject.id;
  console.log(`      ✓ Project ID: ${projectId}`);
  
  // Create a new test board in the project
  console.log('   📦 Creating test board...');
  const testBoard = await createBoard(auth, projectId, '[SCHEMA_TEST] Board');
  const board = testBoard.item || testBoard;
  const boardId = board.id;
  console.log(`      ✓ Board ID: ${boardId}`);
  
  console.log('   Creating initial test data...\n');
  
  // Create test resources in order
  console.log('   📦 Creating test list...');
  const testList = await createList(auth, boardId, '[SCHEMA_TEST] List', 999999);
  const listId = testList.item?.id || testList.id;
  console.log(`      ✓ List ID: ${listId}`);
  
  console.log('   📦 Creating test card...');
  const testCard = await createCard(auth, listId, '[SCHEMA_TEST] Card', 'Test description');
  const cardId = testCard.item?.id || testCard.id;
  console.log(`      ✓ Card ID: ${cardId}`);
  
  console.log('   📦 Creating test label...');
  const testLabel = await createLabel(auth, boardId, '[SCHEMA_TEST] Label', 'berry-red', 999999);
  const labelId = testLabel.item?.id || testLabel.id;
  console.log(`      ✓ Label ID: ${labelId}`);
  
  console.log('   📦 Creating test task list...');
  const testTaskList = await createTaskList(auth, cardId, '[SCHEMA_TEST] TaskList', false);
  const taskListId = testTaskList.item?.id || testTaskList.id;
  console.log(`      ✓ TaskList ID: ${taskListId}`);
  
  console.log('   📦 Creating test task...');
  const testTask = await createTask(auth, taskListId, '[SCHEMA_TEST] Task', 999999);
  const taskId = testTask.item?.id || testTask.id;
  console.log(`      ✓ Task ID: ${taskId}`);
  
  // Try to create optional test resources (spaces, users might fail due to permissions)
  let spaceId: string | undefined;
  let testUserId: string | undefined;
  
  try {
    const { createSpace } = await import('./dist/api/spaces.js');
    console.log('   📦 Creating test space...');
    const testSpace = await createSpace(auth, { name: '[SCHEMA_TEST] Space', isPublic: false });
    spaceId = testSpace.item?.id || testSpace.id;
    console.log(`      ✓ Space ID: ${spaceId}`);
  } catch (err: any) {
    console.log(`      ⚠️  Could not create space: ${err.message}`);
  }
  
  console.log();
  
  // Track created resources for each API test
  const createdResources: Record<string, string> = {};
  
  // Prepare test data with all IDs
  const testData: any = {
    projectId: projectId,
    boardId: boardId,
    listId: listId,
    cardId: cardId,
    labelId: labelId,
    taskListId: taskListId,
    taskId: taskId,
    userId: testUserId,
    spaceId: spaceId,
    // Common optional parameters
    name: '[SCHEMA_TEST] Name',
    updates: { name: '[SCHEMA_TEST] Updated' },
    description: 'Test description',
    color: 'berry-red',
    position: 999999,
    showOnFrontOfCard: false,
    isCompleted: true,
    text: 'Test comment text',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    // Additional test data
    email: 'test@schema.test',
    password: 'TestPassword123!',
    username: 'schematest',
    url: 'https://webhook.test/endpoint',
    events: ['card.create', 'card.update'],
    active: true,
    version: 'v1.0.0',
    format: 'markdown',
    data: {
      name: '[SCHEMA_TEST] Data',
      description: 'Test data object',
      isPublic: false,
      type: 'standard',
      position: 999999,
      url: 'https://webhook.test/endpoint',
      format: 'markdown',
      version: 'v1.0.0',
    },
    reportId: undefined,
    baseCustomFieldGroupId: undefined,
    customFieldGroupId: undefined,
    sectionId: undefined,
    profileId: undefined,
    templateId: undefined,
    file: undefined, // File upload operations
  };

  // Test each API in order
  const testedSchemas: APISchema[] = [];
  let currentCategory = '';
  
  for (const schema of allSchemas) {
    // Print category header when it changes
    if (schema.category !== currentCategory) {
      currentCategory = schema.category;
      const categoryEmoji = {
        create: '🔨 CREATE',
        read: '📖 READ',
        update: '✏️  UPDATE',
        delete: '🗑️  DELETE',
        other: '🔧 OTHER'
      };
      console.log(`\n${categoryEmoji[schema.category]} Operations:`);
    }
    
    const tested = await testAPIWithRealData(auth, schema, testData, createdResources);
    testedSchemas.push(tested);
    
    if (tested.error) {
      console.log(`   ⚠️  ${schema.module}.${schema.name}: ${tested.error}`);
    } else {
      console.log(`   ✅ ${schema.module}.${schema.name}`);
      
      // If this was a create operation, store the ID for future tests
      if (schema.category === 'create' && tested.responseExample) {
        const response = tested.responseExample;
        const id = response.item?.id || response.id;
        if (id) {
          // Store with multiple naming variations
          const resourceName = schema.name.replace('create', '');
          const lowerKey = resourceName.toLowerCase() + 'Id';
          const camelKey = resourceName.charAt(0).toLowerCase() + resourceName.slice(1) + 'Id';
          
          // Store with all variations
          createdResources[lowerKey] = id;
          testData[lowerKey] = id;
          testData[camelKey] = id;
          
          // Add specific mappings for commonly used keys
          if (resourceName === 'BaseCustomFieldGroup') {
            testData['baseCustomFieldGroupId'] = id;
          } else if (resourceName === 'BoardCustomFieldGroup' || resourceName === 'CardCustomFieldGroup') {
            testData['customFieldGroupId'] = id;
          } else if (resourceName === 'CustomFieldInGroup') {
            testData['customFieldId'] = id;
          }
          
          console.log(`      → Stored ${lowerKey}: ${id}`);
        }
      }
    }
  }

  console.log('\n💾 Saving schemas...');
  
  const output = {
    generatedAt: new Date().toISOString(),
    plankaInstance: PLANKA_BASE_URL,
    totalAPIs: testedSchemas.length,
    modules: modules,
    schemas: testedSchemas.map(s => ({
      name: s.name,
      module: s.module,
      category: s.category,
      parameters: s.parameters,
      hasResponse: !!s.responseExample,
      error: s.error,
      // Include truncated examples to avoid huge files
      requestExample: s.requestExample,
      responseSample: s.responseExample ? {
        keys: Object.keys(s.responseExample),
        sample: JSON.stringify(s.responseExample).substring(0, 200) + '...'
      } : null,
    }))
  };

  const outputPath = path.join(__dirname, 'api-schemas.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`✅ Schemas saved to: ${outputPath}`);
  
  // Cleanup test resources
  console.log('\n🧹 Cleaning up test resources...');
  try {
    await deleteTask(auth, testData.taskId);
    await deleteTaskList(auth, testData.taskListId);
    await deleteLabel(auth, testData.labelId);
    await deleteCard(auth, testData.cardId);
    try {
      await deleteList(auth, testData.listId);
    } catch (err: any) {
      // Ignore timeout errors
      if (!err.message?.includes('fetch failed')) throw err;
    }
    // Delete the test board and project
    await deleteBoard(auth, boardId);
    await deleteProject(auth, projectId);
    
    // Delete space if it was created
    if (spaceId) {
      const { deleteSpace } = await import('./dist/api/spaces.js');
      await deleteSpace(auth, spaceId);
    }
    
    console.log('✅ Cleanup completed (including test project, board, and space)');
  } catch (error: any) {
    console.log(`⚠️  Cleanup error: ${error.message}`);
  }
  
  // Generate summary
  const successful = testedSchemas.filter(s => !s.error).length;
  const failed = testedSchemas.filter(s => s.error).length;
  
  console.log('\n📊 Summary:');
  console.log(`   Total APIs: ${testedSchemas.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Modules: ${modules.length}`);
}

generateSchemas().catch(console.error);
