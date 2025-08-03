import bcrypt from 'bcryptjs';

const password = 'erick';

bcrypt.hash(password, 5, (err, hash) => {
  if (err) {
    console.error('❌ Error al encriptar:', err);
  } else {
    console.log('✅ Contraseña encriptada:', hash);
  }
});
