import assert from 'assert';
import { ConfirmationManager } from '../src/core/confirmations.js';

export default async function run() {
  console.log('▶ Testing: Confirmation & Disambiguation System...');
  let passed = 0;

  const cm = new ConfirmationManager();

  // 1. Option selection (e.g. "Which Rahul? 1, 2, or 3")
  let chosenOption = null;
  cm.setPending({
    type: 'SELECT_OPTION',
    options: [
      { label: 'Rahul Sharma', number: '111' },
      { label: 'Rahul Patil', number: '222' },
      { label: 'Rahul Verma', number: '333' },
    ],
    onSelect: async (opt) => {
      chosenOption = opt;
      return { success: true, chosen: opt.label };
    },
  });

  assert.strictEqual(cm.hasPending(), true);
  const selRes = await cm.handleUserInput('2');
  assert.strictEqual(selRes.handled, true);
  assert.strictEqual(chosenOption.label, 'Rahul Patil');
  assert.strictEqual(cm.hasPending(), false);
  console.log('  ✔ selection by index number resolves intended contact option');
  passed++;

  // 2. Direct name match during selection
  cm.setPending({
    type: 'SELECT_OPTION',
    options: [
      { label: 'Rahul Sharma', number: '111' },
      { label: 'Rahul Patil', number: '222' },
    ],
    onSelect: async (opt) => {
      chosenOption = opt;
      return { success: true, chosen: opt.label };
    },
  });
  const nameRes = await cm.handleUserInput('sharma');
  assert.strictEqual(nameRes.handled, true);
  assert.strictEqual(chosenOption.label, 'Rahul Sharma');
  console.log('  ✔ selection by partial name works seamlessly');
  passed++;

  // 3. Action Confirmation (Yes/No)
  let executedAction = false;
  cm.setPending({
    type: 'CONFIRM_ACTION',
    prompt: 'Call Rahul Patil?',
    onConfirm: async () => {
      executedAction = true;
      return { success: true, called: true };
    },
  });
  const yesRes = await cm.handleUserInput('yes');
  assert.strictEqual(yesRes.handled, true);
  assert.strictEqual(executedAction, true);
  console.log('  ✔ yes confirmation executes action');
  passed++;

  // 4. Cancellation
  let cancelledAction = false;
  cm.setPending({
    type: 'CONFIRM_ACTION',
    prompt: 'Delete system files?',
    onConfirm: async () => {
      cancelledAction = true;
    },
  });
  const cancelRes = await cm.handleUserInput('cancel');
  assert.strictEqual(cancelRes.handled, true);
  assert.strictEqual(cancelRes.cancelled, true);
  assert.strictEqual(cancelledAction, false);
  assert.strictEqual(cm.hasPending(), false);
  console.log('  ✔ cancel aborts pending sensitive action safely');
  passed++;

  return { passed, failed: 0 };
}
