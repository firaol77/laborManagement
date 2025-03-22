const bcrypt = require('bcrypt');

const password = 'admin123';
const hashedPassword = bcrypt.hashSync(password, 10); // 10 is the salt rounds
console.log(hashedPassword);