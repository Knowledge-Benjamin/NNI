const bcrypt = require('bcryptjs');

const password = 'Knowben0181?'; // CHANGE THIS TO SOMETHING STRONG
bcrypt.hash(password, 10).then(hash => {
  console.log('Admin password hash:');
  console.log(hash);
});