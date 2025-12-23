/**
 * API Schema Generator for Rastar
 * 
 * Dynamically discovers all API functions and generates schema documentation
 * by analyzing function signatures and making test calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import type { RastarAuth } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment
dotenv.config({ path: path.join(__dirname, '.env.test') });

interface APISchema {
  name: string;
  module: string;
  category: 'auth' | 'read' | 'create' | 'delete';
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  requestExample?: any;
  responseExample?: any;
  error?: string;
}

function categorizeAPI(funcName: string): 'auth' | 'read' | 'create' | 'delete' {
  const name = funcName.toLowerCase();
  if (name.includes('login') || name.includes('refresh') || name.includes('token')) return 'auth';
  if (name.startsWith('create')) return 'create';
  if (name.startsWith('delete') || name.includes('remove')) return 'delete';
  if (name.startsWith('get') || name.startsWith('list')) return 'read';
  return 'read';
}

async function discoverAPIModules(): Promise<string[]> {
  const apiDir = path.join(__dirname, 'src', 'api');
  const files = fs.readdirSync(apiDir);
  
  return files
    .filter(file => 
      file.endsWith('.ts') && 
      !file.includes('test') && 
      file !== 'client.ts' && 
      file !== 'index.ts'
    )
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
              type: 'string', // Default to string
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
  auth: RastarAuth | undefined,
  schema: APISchema,
  testData: any,
  userId: string
): Promise<APISchema> {
  try {
    const modulePath = `./dist/api/${schema.module}.js`;
    const module = await import(modulePath);
    const func = module[schema.name];
    
    if (!func) {
      schema.error = 'Function not found';
      return schema;
    }
    
    // Build arguments based on the function
    const args: any[] = [];
    
    // Auth functions don't need auth parameter
    if (schema.category !== 'auth') {
      args.push(auth);
    }
    
    // Add test data arguments
    for (const param of schema.parameters) {
      if (param.name === 'userId') {
        args.push(userId);
      } else if (testData[param.name]) {
        args.push(testData[param.name]);
      } else if (param.required) {
        schema.error = `Missing required test data: ${param.name}`;
        return schema;
      }
    }
    
    // Call the function
    console.log(`   Testing ${schema.module}.${schema.name}...`);
    const result = await func(...args);
    
    schema.responseExample = result;
    schema.requestExample = { args: args.slice(schema.category === 'auth' ? 0 : 1) };
    
  } catch (error: any) {
    schema.error = error.message;
  }
  
  return schema;
}

async function generateSchemas() {
  const EMAIL = process.env.TEST_EMAIL;
  const PASSWORD = process.env.TEST_PASSWORD;
  const BASE_URL = process.env.RASTAR_BASE_URL || 'https://hhryf.supabase.co';

  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'Missing TEST_EMAIL or TEST_PASSWORD. ' +
      'Copy .env.test.example to .env.test and fill in your credentials.'
    );
  }

  console.log('🔐 Authenticating...');
  const { login } = await import('./dist/api/auth.js');
  const tokenResponse = await login(EMAIL, PASSWORD);
  console.log('✅ Authenticated\n');

  const auth: RastarAuth = {
    rastarBaseUrl: BASE_URL,
    accessToken: tokenResponse.access_token,
  };
  
  const userId = tokenResponse.user.id;

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

  // Sort schemas by category: auth → read → create → delete
  const categoryOrder = { auth: 1, read: 2, create: 3, delete: 4 };
  allSchemas.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category]);

  console.log('🧪 Testing APIs with real data...');
  
  // Get menu schedule for test data
  const { getMenuSchedule } = await import('./dist/api/menu.js');
  const schedule = await getMenuSchedule(auth);
  const testScheduleId = schedule.length > 0 ? schedule[0].id : undefined;
  
  // Prepare test data
  const testData: any = {
    email: EMAIL,
    password: PASSWORD,
    refreshToken: tokenResponse.refresh_token,
    userId: userId,
    menuScheduleId: testScheduleId,
  };
  
  // Track created resources for cleanup
  const createdResources: { selections: string[] } = { selections: [] };

  // Test each API
  const testedSchemas: APISchema[] = [];
  let currentCategory = '';
  
  for (const schema of allSchemas) {
    // Print category header when it changes
    if (schema.category !== currentCategory) {
      currentCategory = schema.category;
      const categoryEmoji = {
        auth: '🔐 AUTHENTICATION',
        read: '📖 READ',
        create: '🔨 CREATE',
        delete: '🗑️  DELETE',
      };
      console.log(`\n${categoryEmoji[schema.category]} Operations:`);
    }
    
    // Skip auth functions in testing (already authenticated)
    if (schema.category === 'auth' && schema.name !== 'login') {
      console.log(`   ⏭️  ${schema.module}.${schema.name}: Skipped (already tested during auth)`);
      testedSchemas.push(schema);
      continue;
    }
    
    const tested = await testAPIWithRealData(
      schema.category === 'auth' ? undefined : auth,
      schema,
      testData,
      userId
    );
    testedSchemas.push(tested);
    
    if (tested.error) {
      console.log(`   ⚠️  ${schema.module}.${schema.name}: ${tested.error}`);
    } else {
      console.log(`   ✅ ${schema.module}.${schema.name}`);
      
      // If this was a create operation, store the ID for cleanup
      if (schema.category === 'create' && tested.responseExample) {
        const response = tested.responseExample;
        const id = response.id;
        if (id && schema.name === 'createMenuSelection') {
          createdResources.selections.push(id);
          // Add to testData for delete operations
          testData.selectionId = id;
          console.log(`      → Created selection ID: ${id}`);
        }
      }
    }
  }

  console.log('\n💾 Saving schemas...');
  
  const output = {
    generatedAt: new Date().toISOString(),
    rastarInstance: BASE_URL,
    totalAPIs: testedSchemas.length,
    modules: modules,
    schemas: testedSchemas.map(s => ({
      name: s.name,
      module: s.module,
      category: s.category,
      parameters: s.parameters,
      hasResponse: !!s.responseExample,
      error: s.error,
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
  if (createdResources.selections.length > 0) {
    console.log('\n🧹 Cleaning up test resources...');
    const { deleteMenuSelection } = await import('./dist/api/menu.js');
    
    for (const selectionId of createdResources.selections) {
      try {
        await deleteMenuSelection(auth, selectionId);
        console.log(`   ✅ Deleted selection: ${selectionId}`);
      } catch (error: any) {
        console.log(`   ⚠️  Failed to delete selection ${selectionId}: ${error.message}`);
      }
    }
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
