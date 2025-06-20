const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/auth/AuthController');

// Ruta de inicio de sesión
router.post('/login', AuthController.login);

// (Opcional) Ruta para registrar usuarios, si lo necesitas
// router.post('/register', AuthController.register);

module.exports = router;
