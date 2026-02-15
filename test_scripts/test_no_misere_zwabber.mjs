// Test script to verify that Misère and Zwabber bidding options are removed
// This test checks the TypeScript source code to ensure misere and zwabber are removed
// Run with: node test_scripts/test_no_misere_zwabber.mjs

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🧪 Testing that Misère and Zwabber are removed from bidding system\n');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

// Read the source files
const sharedIndex = readFileSync(join(rootDir, 'shared/src/index.ts'), 'utf8');
const biddingTs = readFileSync(join(rootDir, 'server/src/game/bidding.ts'), 'utf8');
const biddingPhaseTsx = readFileSync(join(rootDir, 'client/src/components/BiddingPhase.tsx'), 'utf8');

// Test 1: BidType should NOT include 'misere' or 'zwabber'
const bidTypeMatch = sharedIndex.match(/export type BidType = ([^;]+);/);
if (bidTypeMatch) {
  const bidType = bidTypeMatch[1];
  test('BidType should not include "misere"', !bidType.includes('misere'));
  test('BidType should not include "zwabber"', !bidType.includes('zwabber'));
  test('BidType should include "normal"', bidType.includes('normal'));
  test('BidType should include "bonaak"', bidType.includes('bonaak'));
  test('BidType should include "bonaak-roem"', bidType.includes('bonaak-roem'));
} else {
  test('Could not find BidType definition', false);
  failed += 4;
}

// Test 2: Bidding logic should not reference 'misere' or 'zwabber'
test('bidding.ts should not reference "misere"', !biddingTs.includes("'misere'") && !biddingTs.includes('"misere"'));
test('bidding.ts should not reference "zwabber"', !biddingTs.includes("'zwabber'") && !biddingTs.includes('"zwabber"'));

// Test 3: BiddingPhase should not have UI for misere or zwabber
test('BiddingPhase.tsx should not have Misère button', !biddingPhaseTsx.includes('Misère'));
test('BiddingPhase.tsx should not have Zwabber button', !biddingPhaseTsx.includes('Zwabber'));
test('BiddingPhase.tsx should not have canMisere', !biddingPhaseTsx.includes('canMisere'));
test('BiddingPhase.tsx should not have canZwabber', !biddingPhaseTsx.includes('canZwabber'));

// Test 4: Normal bidding and Bonaak should still work
test('bidding.ts should still have normal bid logic', biddingTs.includes("case 'normal':"));
test('bidding.ts should still have bonaak logic', biddingTs.includes("case 'bonaak':"));
test('bidding.ts should still have bonaak-roem logic', biddingTs.includes("case 'bonaak-roem':"));
test('BiddingPhase should still have Bonaak button', biddingPhaseTsx.includes('Bonaak'));
test('BiddingPhase should still have canBonaak', biddingPhaseTsx.includes('canBonaak'));

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n❌ TESTS FAILED - Misère and/or Zwabber still exist in the system');
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED - Misère and Zwabber are properly removed');
  process.exit(0);
}
