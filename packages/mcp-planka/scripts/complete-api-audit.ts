#!/usr/bin/env node --import tsx/esm
/**
 * Complete API Response Auditor
 * Fetches real responses from ALL major Planka API endpoints
 */

import type { PlankaAuth } from './src/types/index.js';
import { plankaFetch } from './src/api/client.js';
import * as fs from 'fs';

const auth: PlankaAuth = {
  plankaBaseUrl: process.env.PLANKA_BASE_URL || 'https://pm-dev.rastar.dev',
  accessToken: process.env.PLANKA_AUTH_TOKEN || '',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface EndpointResult {
  endpoint: string;
  method: string;
  sample?: any;
  fields?: string[];
  error?: string;
}

const results: Record<string, EndpointResult> = {};

async function fetchEndpoint(name: string, endpoint: string, method: string = 'GET', printSample: boolean = false): Promise<void> {
  console.log(`📍 ${name}: ${method} ${endpoint}`);
  try {
    const response = await plankaFetch(auth, endpoint, { method });
    const fields = response.item ? Object.keys(response.item) : Object.keys(response);
    
    results[name] = {
      endpoint,
      method,
      sample: response,
      fields
    };
    
    console.log(`   ✅ Fields: ${fields.join(', ')}`);
    
    if (printSample) {
      console.log(`   📄 Sample Response:`);
      console.log(JSON.stringify(response, null, 2).split('\n').slice(0, 30).join('\n'));
      console.log(`   ... (truncated)\n`);
    } else {
      console.log('');
    }
  } catch (e: any) {
    results[name] = {
      endpoint,
      method,
      error: e.message
    };
    console.log(`   ❌ Error: ${e.message}`);
    console.log(`   💡 This might be an authentication issue or wrong endpoint path\n`);
  }
  await delay(1500);
}

async function audit() {
  console.log('🔍 Complete API Response Audit\n');
  console.log('=' .repeat(80) + '\n');

  // Current User - Try multiple possible endpoints
  console.log('🔹 CURRENT USER ENDPOINTS:\n');
  await fetchEndpoint('current_user_me', '/api/users/me', 'GET', true);
  
  // Projects
  console.log('\n🔹 PROJECT ENDPOINTS:\n');
  await fetchEndpoint('list_projects', '/api/projects', 'GET', true);
  const projects = results.list_projects?.sample?.items || [];
  if (projects.length > 0) {
    const projectId = projects[0].id;
    await fetchEndpoint('get_project', `/api/projects/${projectId}`, 'GET', true);
  }

  // Boards
  console.log('\n🔹 BOARD ENDPOINTS:\n');
  if (projects.length > 0) {
    const projectDetails = results.get_project?.sample;
    const boards = projectDetails?.included?.boards || [];
    if (boards.length > 0) {
      const boardId = boards[0].id;
      await fetchEndpoint('get_board', `/api/boards/${boardId}`, 'GET', true);
      
      // Lists from board
      console.log('\n🔹 LIST ENDPOINTS:\n');
      const boardDetails = results.get_board?.sample;
      const lists = boardDetails?.included?.lists || [];
      if (lists.length > 0) {
        const listId = lists[0].id;
        await fetchEndpoint('get_list', `/api/lists/${listId}`, 'GET', true);
      }
      
      // Cards from board
      console.log('\n🔹 CARD ENDPOINTS:\n');
      const cards = boardDetails?.included?.cards || [];
      if (cards.length > 0) {
        const cardId = cards[0].id;
        await fetchEndpoint('get_card', `/api/cards/${cardId}`, 'GET', true);
        
        // Comments for card
        await fetchEndpoint('get_card_comments', `/api/cards/${cardId}/comments`, 'GET', true);
        
        // Actions for card
        await fetchEndpoint('get_card_actions', `/api/cards/${cardId}/actions`, 'GET', true);
        
        // Attachments
        const attachments = boardDetails?.included?.attachments || [];
        if (attachments.length > 0) {
          console.log(`\n🔹 ATTACHMENTS (from board included):`);
          console.log(`   📎 Found ${attachments.length} attachments`);
          console.log(`   📄 Sample:`, JSON.stringify(attachments[0], null, 2));
          console.log('');
          results['attachments_sample'] = {
            endpoint: 'from board',
            method: 'included',
            sample: attachments[0],
            fields: Object.keys(attachments[0])
          };
        }
      }
      
      // Tasks from board
      console.log('\n🔹 TASKS (from board included):\n');
      const taskLists = boardDetails?.included?.taskLists || [];
      const tasks = boardDetails?.included?.tasks || [];
      if (tasks.length > 0) {
        console.log(`   ✅ Found ${tasks.length} tasks from ${taskLists.length} task lists`);
        console.log(`   📄 Task Sample:`, JSON.stringify(tasks[0], null, 2));
        console.log('');
        results['tasks_sample'] = {
          endpoint: 'from board',
          method: 'included',
          sample: tasks[0],
          fields: Object.keys(tasks[0])
        };
      }
      
      // Labels
      console.log('\n🔹 LABEL ENDPOINTS:\n');
      const labels = boardDetails?.included?.labels || [];
      if (labels.length > 0) {
        console.log(`   📄 Label from board:`, JSON.stringify(labels[0], null, 2));
        console.log('   ⏭️  Skipping /api/labels/{id} (returns HTML/not supported)\n');
        results['get_label'] = {
          endpoint: '/api/labels/{id}',
          method: 'SKIP',
          sample: labels[0],
          fields: Object.keys(labels[0]),
        };
      }
      
      // Card Memberships
      const cardMemberships = boardDetails?.included?.cardMemberships || [];
      if (cardMemberships.length > 0) {
        console.log(`\n🔹 CARD MEMBERSHIPS (from board included):`);
        console.log(`   ✅ Found ${cardMemberships.length} card memberships`);
        console.log(`   📄 Sample:`, JSON.stringify(cardMemberships[0], null, 2));
        console.log('');
        results['card_memberships_sample'] = {
          endpoint: 'from board',
          method: 'included',
          sample: cardMemberships[0],
          fields: Object.keys(cardMemberships[0])
        };
      }
      
      // Card Labels
      const cardLabels = boardDetails?.included?.cardLabels || [];
      if (cardLabels.length > 0) {
        console.log(`\n🔹 CARD LABELS (from board included):`);
        console.log(`   ✅ Found ${cardLabels.length} card labels`);
        console.log(`   📄 Sample:`, JSON.stringify(cardLabels[0], null, 2));
        console.log('');
        results['card_labels_sample'] = {
          endpoint: 'from board',
          method: 'included',
          sample: cardLabels[0],
          fields: Object.keys(cardLabels[0])
        };
      }
      
      // Board Actions
      console.log('\n🔹 BOARD ACTION ENDPOINTS:\n');
      await fetchEndpoint('get_board_actions', `/api/boards/${boardId}/actions`, 'GET', true);
    }
  }

  // Users
  console.log('\n🔹 USER ENDPOINTS:\n');
  await fetchEndpoint('list_users', '/api/users', 'GET', true);
  
  // Notifications
  console.log('\n🔹 NOTIFICATION ENDPOINTS:\n');
  await fetchEndpoint('get_notifications', '/api/notifications', 'GET', true);
  
  // Actions - Try user-specific actions instead of global
  console.log('\n🔹 ACTION ENDPOINTS:\n');
  const userId = results.current_user_me?.sample?.item?.id;
  if (userId) {
    console.log('   ⏭️  Skipping /api/users/{id}/actions (returns HTML/not supported)');
    results['get_user_actions'] = {
      endpoint: '/api/users/{id}/actions',
      method: 'SKIP',
      sample: { note: 'unsupported; returns HTML', use: 'board/card actions filtered by userId' },
      fields: ['note', 'use'],
    };
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary:\n');
  
  const successful = Object.values(results).filter(r => !r.error).length;
  const failed = Object.values(results).filter(r => r.error).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total endpoints checked: ${Object.keys(results).length}\n`);

  // Save results
  const outputPath = './complete-api-audit.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Full results saved to: ${outputPath}\n`);
  
  // Generate TypeScript interfaces
  console.log('🔧 Generating TypeScript type updates...\n');
  generateTypeUpdates();
}

function generateTypeUpdates() {
  const updates: string[] = [];
  
  // Generate interfaces from samples
  for (const [name, result] of Object.entries(results)) {
    if (result.sample && result.fields) {
      const interfaceName = name.split('_').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join('');
      
      if (result.sample.item) {
        updates.push(`\n// ${name}`);
        updates.push(`export interface Planka${interfaceName} {`);
        const item = result.sample.item;
        for (const field of Object.keys(item)) {
          const value = item[field];
          const type = inferType(value);
          const optional = value === null || value === undefined ? '?' : '';
          updates.push(`  ${field}${optional}: ${type};`);
        }
        updates.push(`}`);
      } else if (Array.isArray(result.sample.items) && result.sample.items.length > 0) {
        const item = result.sample.items[0];
        updates.push(`\n// ${name} (from array)`);
        updates.push(`export interface Planka${interfaceName}Item {`);
        for (const field of Object.keys(item)) {
          const value = item[field];
          const type = inferType(value);
          const optional = value === null || value === undefined ? '?' : '';
          updates.push(`  ${field}${optional}: ${type};`);
        }
        updates.push(`}`);
      }
    }
  }
  
  const typesPath = './generated-types.ts';
  fs.writeFileSync(typesPath, updates.join('\n'));
  console.log(`📄 Type definitions saved to: ${typesPath}\n`);
}

function inferType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'any[]';
  if (typeof value === 'object') return 'any';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'any';
}

audit().catch(console.error);
