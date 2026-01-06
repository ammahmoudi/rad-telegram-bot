#!/usr/bin/env node --import tsx/esm
/**
 * Comprehensive API Structure Audit
 * Fetches real API responses to document actual field structures
 */

import { getCurrentUser, listProjects, getProject, getBoard } from './src/api/index.js';
import type { PlankaAuth } from './src/types/index.js';
import * as fs from 'fs';

const auth: PlankaAuth = {
  plankaBaseUrl: process.env.PLANKA_BASE_URL || 'https://pm-dev.rastar.dev',
  accessToken: process.env.PLANKA_AUTH_TOKEN || '',
};

async function audit() {
  const results: any = {
    timestamp: new Date().toISOString(),
    endpoints: {}
  };

  console.log('🔍 Starting API Structure Audit...\n');

  // 1. Current User
  console.log('📍 Fetching current user...');
  try {
    const user = await getCurrentUser(auth);
    results.endpoints.currentUser = {
      sample: user,
      fields: Object.keys(user)
    };
    console.log(`   ✅ User fields: ${Object.keys(user).join(', ')}\n`);
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}\n`);
  }

  // 2. Projects List
  console.log('📍 Fetching projects list...');
  try {
    const projects = await listProjects(auth);
    if (projects.length > 0) {
      results.endpoints.projects = {
        count: projects.length,
        sample: projects[0],
        fields: Object.keys(projects[0])
      };
      console.log(`   ✅ Found ${projects.length} projects`);
      console.log(`   ✅ Project fields: ${Object.keys(projects[0]).join(', ')}\n`);
    }
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}\n`);
  }

  // 3. Project Details (with boards)
  console.log('📍 Fetching project details...');
  try {
    const projects = await listProjects(auth);
    if (projects.length > 0) {
      const projectId = (projects[0] as any).id;
      const projectDetails = await getProject(auth, projectId);
      
      const item = (projectDetails as any).item;
      const included = (projectDetails as any).included;
      
      results.endpoints.projectDetails = {
        itemFields: Object.keys(item || {}),
        includedKeys: Object.keys(included || {}),
        boards: included?.boards?.length || 0,
        users: included?.users?.length || 0,
        boardSample: included?.boards?.[0],
        boardFields: included?.boards?.[0] ? Object.keys(included.boards[0]) : []
      };
      
      console.log(`   ✅ Project item fields: ${Object.keys(item || {}).join(', ')}`);
      console.log(`   ✅ Included sections: ${Object.keys(included || {}).join(', ')}`);
      if (included?.boards?.[0]) {
        console.log(`   ✅ Board fields: ${Object.keys(included.boards[0]).join(', ')}\n`);
      }
    }
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}\n`);
  }

  // 4. Board Details (with cards, lists, tasks)
  console.log('📍 Fetching board details...');
  try {
    const projects = await listProjects(auth);
    if (projects.length > 0) {
      const projectDetails = await getProject(auth, (projects[0] as any).id);
      const boards = (projectDetails as any)?.included?.boards || [];
      
      if (boards.length > 0) {
        const boardId = boards[0].id;
        const boardDetails = await getBoard(auth, boardId);
        
        const item = (boardDetails as any).item;
        const included = (boardDetails as any).included;
        
        results.endpoints.boardDetails = {
          itemFields: Object.keys(item || {}),
          includedKeys: Object.keys(included || {}),
          lists: included?.lists?.length || 0,
          cards: included?.cards?.length || 0,
          tasks: included?.tasks?.length || 0,
          cardSample: included?.cards?.[0],
          cardFields: included?.cards?.[0] ? Object.keys(included.cards[0]) : [],
          listSample: included?.lists?.[0],
          listFields: included?.lists?.[0] ? Object.keys(included.lists[0]) : [],
          taskSample: included?.tasks?.[0],
          taskFields: included?.tasks?.[0] ? Object.keys(included.tasks[0]) : [],
          cardMembershipSample: included?.cardMemberships?.[0],
          cardMembershipFields: included?.cardMemberships?.[0] ? Object.keys(included.cardMemberships[0]) : [],
          cardLabelSample: included?.cardLabels?.[0],
          cardLabelFields: included?.cardLabels?.[0] ? Object.keys(included.cardLabels[0]) : []
        };
        
        console.log(`   ✅ Board item fields: ${Object.keys(item || {}).join(', ')}`);
        console.log(`   ✅ Included sections: ${Object.keys(included || {}).join(', ')}`);
        console.log(`   ✅ Cards: ${included?.cards?.length || 0}`);
        console.log(`   ✅ Lists: ${included?.lists?.length || 0}`);
        console.log(`   ✅ Tasks: ${included?.tasks?.length || 0}`);
        
        if (included?.cards?.[0]) {
          console.log(`   ✅ Card fields: ${Object.keys(included.cards[0]).join(', ')}`);
          console.log(`   📝 Card sample:`, JSON.stringify(included.cards[0], null, 2));
        }
        
        if (included?.lists?.[0]) {
          console.log(`   ✅ List fields: ${Object.keys(included.lists[0]).join(', ')}`);
        }
        
        if (included?.tasks?.[0]) {
          console.log(`   ✅ Task fields: ${Object.keys(included.tasks[0]).join(', ')}`);
        }
        
        console.log('\n');
      }
    }
  } catch (e: any) {
    console.error(`   ❌ Error: ${e.message}\n`);
  }

  // Save results to file
  const outputPath = './api-audit-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full audit saved to: ${outputPath}`);
  
  console.log('\n✅ Audit complete!');
}

audit().catch(console.error);
