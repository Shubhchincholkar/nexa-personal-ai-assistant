import assert from 'assert';
import { searchContactsList, contactsTool } from '../src/tools/contacts.js';

export default async function run() {
  console.log('▶ Testing: Contacts Search & Disambiguation...');
  let passed = 0;

  const mockContacts = [
    { name: 'Rahul Sharma', number: '+91 98765 43210' },
    { name: 'Rahul Patil', number: '+91 91234 56789' },
    { name: 'Rahul Verma', number: '+91 99887 76655' },
    { name: 'Priya Singh', number: '+91 98111 22233' },
  ];

  // 1. Partial case-insensitive search
  const matches = searchContactsList(mockContacts, 'rahul');
  assert.strictEqual(matches.length, 3);
  console.log('  ✔ case-insensitive search returns all matches');
  passed++;

  // 2. Exact match priority
  const priya = searchContactsList(mockContacts, 'Priya Singh');
  assert.strictEqual(priya.length, 1);
  assert.strictEqual(priya[0].name, 'Priya Singh');
  console.log('  ✔ exact match found directly');
  passed++;

  // 3. Tool execution
  const res = await contactsTool.execute({ name: 'Rahul' });
  assert.strictEqual(res.success, true);
  assert.ok(res.data.matches.length >= 3);
  console.log('  ✔ contactsTool executes and returns list');
  passed++;

  return { passed, failed: 0 };
}
