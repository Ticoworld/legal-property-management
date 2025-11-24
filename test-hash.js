const bcrypt = require('bcryptjs');

const hash = '$2a$10$eXbVwqw45Ug7KTmf9K0z/ONn8nwgLfsRT2d2V0k0IgJSWsGzELnrO';
const password = 'Admin123!';

console.log('Testing hash from database...');
console.log('Hash:', hash);
console.log('Password:', password);

bcrypt.compare(password, hash).then(result => {
  console.log('\n✓ Password matches:', result);
  
  if (!result) {
    console.log('\nTrying other common passwords...');
    const attempts = ['admin123', 'Admin123', 'admin', 'password'];
    Promise.all(attempts.map(p => 
      bcrypt.compare(p, hash).then(r => ({ password: p, match: r }))
    )).then(results => {
      results.forEach(r => {
        if (r.match) console.log(`  ✓ MATCH: "${r.password}"`);
      });
      console.log('\nGenerating new hash for Admin123!...');
      return bcrypt.hash('Admin123!', 10);
    }).then(newHash => {
      console.log('New hash:', newHash);
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
