import assert from 'assert';
import { notesManager, notesTool } from '../src/tools/notes.js';

export default async function run() {
  console.log('▶ Testing: Notes Tool...');
  let passed = 0;

  // 1. Save a note
  const saveRes = await notesTool.execute({
    action: 'save',
    title: 'seminar',
    content: 'My seminar is scheduled on Friday at 2 PM.',
  });
  assert.strictEqual(saveRes.success, true);
  console.log('  ✔ saved note successfully');
  passed++;

  // 2. Read note back
  const getRes = await notesTool.execute({
    action: 'get',
    title: 'seminar',
  });
  assert.strictEqual(getRes.success, true);
  assert.ok(getRes.data.content.includes('Friday'));
  console.log('  ✔ read note content accurately');
  passed++;

  // 3. List notes
  const listRes = await notesTool.execute({ action: 'list' });
  assert.strictEqual(listRes.success, true);
  assert.ok(listRes.data.notes.length >= 1);
  console.log('  ✔ listed notes correctly');
  passed++;

  // 4. Delete note
  const delRes = await notesTool.execute({ action: 'delete', title: 'seminar' });
  assert.strictEqual(delRes.success, true);
  console.log('  ✔ deleted note cleanly');
  passed++;

  return { passed, failed: 0 };
}
