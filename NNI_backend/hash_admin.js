const bcrypt = require('bcryptjs');

// Use an environment variable for the admin password to avoid committing secrets.
// Example: ADMIN_PASSWORD='YourStrongPass123!' node hash_admin.js
const plain = process.env.ADMIN_PASSWORD;
if (!plain) {
  console.error(
    'ERROR: set ADMIN_PASSWORD in the environment before running this script.'
  );
  process.exit(1);
}
bcrypt.hash(plain, 10).then((hash) => {
  console.log('Admin password hash:');
  console.log(hash);
});