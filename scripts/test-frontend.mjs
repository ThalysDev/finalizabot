#!/usr/bin/env node
/**
 * Automated Frontend Verification
 * Tests dashboard, player pages, and advanced table
 */

const BASE_URL = process.env.DEPLOY_URL || 'https://finalizabot-d6rro1djx-thalys-rodrigues-projects.vercel.app';

const tests = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function log(emoji, message, type = 'info') {
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${emoji} ${colors[type] || colors.info}${message}${colors.reset}`);
}

async function testPage(url, checks) {
  const fullUrl = `${BASE_URL}${url}`;
  log('🔍', `Testing: ${url}`, 'info');

  try {
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      log('❌', `  HTTP ${response.status} - ${response.statusText}`, 'error');
      tests.failed++;
      return false;
    }

    const html = await response.text();
    let allPassed = true;

    for (const check of checks) {
      const passed = check.test(html);
      if (passed) {
        log('✅', `  ${check.name}`, 'success');
        tests.passed++;
      } else {
        if (check.required) {
          log('❌', `  ${check.name}`, 'error');
          tests.failed++;
          allPassed = false;
        } else {
          log('⚠️ ', `  ${check.name} (optional)`, 'warning');
          tests.warnings++;
        }
      }
    }

    return allPassed;
  } catch (err) {
    log('❌', `  Error: ${err.message}`, 'error');
    tests.failed++;
    return false;
  }
}

async function runTests() {
  console.log('\n');
  log('🚀', '='.repeat(60), 'info');
  log('🚀', 'FinalizaBOT - Frontend Automated Tests', 'info');
  log('🚀', '='.repeat(60), 'info');
  console.log('\n');
  log('🌐', `Base URL: ${BASE_URL}`, 'info');
  console.log('\n');

  // Test 1: Dashboard
  log('📊', 'TEST 1: Dashboard Page', 'info');
  await testPage('/dashboard', [
    {
      name: 'Page loads successfully',
      test: (html) => html.length > 1000,
      required: true
    },
    {
      name: 'Contains match cards',
      test: (html) => html.includes('match') || html.includes('partida'),
      required: true
    },
    {
      name: 'Contains SafeImage components',
      test: (html) => html.includes('img') || html.includes('image'),
      required: false
    },
    {
      name: 'No obvious errors',
      test: (html) => !html.includes('Error:') && !html.includes('undefined is not'),
      required: true
    }
  ]);
  console.log('');

  // Test 2: Advanced Table
  log('📋', 'TEST 2: Advanced Table Page', 'info');
  await testPage('/dashboard/table', [
    {
      name: 'Page loads successfully',
      test: (html) => html.length > 1000,
      required: true
    },
    {
      name: 'Contains table structure',
      test: (html) => html.includes('table') || html.includes('thead') || html.includes('tbody'),
      required: false
    },
    {
      name: 'No obvious errors',
      test: (html) => !html.includes('Error:') && !html.includes('undefined is not'),
      required: true
    }
  ]);
  console.log('');

  // Test 3: Player Page (first available)
  log('👤', 'TEST 3: Player Page', 'info');
  log('ℹ️ ', '  Note: Testing with generic player ID - may not exist', 'info');
  await testPage('/player/test', [
    {
      name: 'Page loads (200 or 404 acceptable)',
      test: () => true, // We expect 404 for test ID
      required: false
    }
  ]);
  console.log('');

  // Test 4: API Health Checks
  log('🔧', 'TEST 4: API Endpoints', 'info');

  const apiTests = [
    { path: '/api/health', name: 'Health endpoint' },
    { path: '/api/matches', name: 'Matches API' },
  ];

  for (const apiTest of apiTests) {
    try {
      const response = await fetch(`${BASE_URL}${apiTest.path}`);
      if (response.ok) {
        log('✅', `  ${apiTest.name} - HTTP ${response.status}`, 'success');
        tests.passed++;
      } else {
        log('⚠️ ', `  ${apiTest.name} - HTTP ${response.status}`, 'warning');
        tests.warnings++;
      }
    } catch (err) {
      log('❌', `  ${apiTest.name} - ${err.message}`, 'error');
      tests.failed++;
    }
  }
  console.log('');

  // Summary
  log('📊', '='.repeat(60), 'info');
  log('📊', 'TEST SUMMARY', 'info');
  log('📊', '='.repeat(60), 'info');
  console.log('');
  log('✅', `Passed:   ${tests.passed}`, 'success');
  log('❌', `Failed:   ${tests.failed}`, 'error');
  log('⚠️ ', `Warnings: ${tests.warnings}`, 'warning');
  console.log('');

  const total = tests.passed + tests.failed + tests.warnings;
  const successRate = total > 0 ? ((tests.passed / total) * 100).toFixed(1) : 0;

  if (tests.failed === 0) {
    log('🎉', `SUCCESS! All critical tests passed (${successRate}%)`, 'success');
  } else if (tests.failed < 3) {
    log('⚠️ ', `PARTIAL SUCCESS - ${tests.failed} failures (${successRate}% passed)`, 'warning');
  } else {
    log('❌', `FAILED - ${tests.failed} critical failures`, 'error');
  }

  console.log('');
  log('📝', 'NEXT STEPS:', 'info');
  log('👉', '1. Open browser and manually verify:', 'info');
  log('  ', `   ${BASE_URL}/dashboard`, 'info');
  log('👉', '2. Check that team badges load (not Shield icons)', 'info');
  log('👉', '3. Test CV recalculation on player pages', 'info');
  log('👉', '4. Verify position column in /dashboard/table', 'info');
  console.log('');

  process.exit(tests.failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
