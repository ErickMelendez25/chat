import bcrypt from 'bcryptjs';

const password = '200382025T';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error al encriptar:', err);
  } else {
    console.log('✅ Contraseña encriptada:', hash);
  }
});
