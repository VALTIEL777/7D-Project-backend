const express = require('express');
const UserController = require('../../controllers/users/UserController');

const router = express.Router();

router.post('/', UserController.createUser);
router.get('/:userId', UserController.getUserById);
router.get('/', UserController.getAllUsers);
router.put('/:userId', UserController.updateUser);
router.delete('/:userId', UserController.deleteUser);

module.exports = router; 