import express from 'express';
const router = express.Router();

// aquí tus rutas, ejemplo:
router.get('/', (req, res) => {
  res.send('API funcionando');
});

export default router;
