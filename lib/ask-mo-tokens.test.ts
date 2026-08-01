import test from 'node:test';
import assert from 'node:assert/strict';
import { getTokenSpendPlan, shouldBlockAskMoRequest } from './ask-mo-tokens';

test('Ask MO requests remain allowed even with low balance', () => {
  assert.equal(shouldBlockAskMoRequest(0, 25), false);
  assert.equal(shouldBlockAskMoRequest(5, 25), false);
  assert.equal(shouldBlockAskMoRequest(100, 25), false);
});

test('Ask MO starts from 2000 free tokens and prompts when exhausted', () => {
  const firstUse = getTokenSpendPlan(2000, 10);
  assert.equal(firstUse.amountToDeduct, 10);
  assert.equal(firstUse.nextBalance, 1990);
  assert.equal(firstUse.shouldPromptForPurchase, false);

  const exhausted = getTokenSpendPlan(5, 10);
  assert.equal(exhausted.amountToDeduct, 5);
  assert.equal(exhausted.nextBalance, 0);
  assert.equal(exhausted.shouldPromptForPurchase, true);
});
