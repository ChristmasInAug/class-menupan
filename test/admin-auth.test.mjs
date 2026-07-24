import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdminCredentials } from '../lib/adminAuth.mjs';

test('shouldVerifyAdminCredentials', () => {
  assert.equal(verifyAdminCredentials('admin', '1234'), true);
  assert.equal(verifyAdminCredentials('admin', 'wrong'), false);
  assert.equal(verifyAdminCredentials('nobody', '1234'), false);
});
