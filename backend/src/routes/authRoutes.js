const express = require('express');
const { login, changePassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;


