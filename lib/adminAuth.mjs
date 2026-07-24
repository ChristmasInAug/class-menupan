const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1234';

export function verifyAdminCredentials(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
