const express = require('express');
const UserController = require('../../controllers/users/UserController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and retrieval
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username.
 *                 example: newuser
 *               password:
 *                 type: string
 *                 description: The user's password.
 *                 example: strongpassword
 *     responses:
 *       201:
 *         description: The user was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 UserId:
 *                   type: integer
 *                   description: The auto-generated ID of the user.
 *                   example: 4
 *                 username:
 *                   type: string
 *                   example: newuser
 *       500:
 *         description: Server error
 */
router.post('/', UserController.createUser);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user description by ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 UserId:
 *                   type: integer
 *                   description: The user ID.
 *                   example: 1
 *                 username:
 *                   type: string
 *                   description: The user's username.
 *                   example: john_doe
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:userId', UserController.getUserById);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   UserId:
 *                     type: integer
 *                     description: The user ID.
 *                     example: 1
 *                   username:
 *                     type: string
 *                     description: The user's username.
 *                     example: john_doe
 *       500:
 *         description: Server error
 */
router.get('/', UserController.getAllUsers);

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The updated username.
 *                 example: updated_user
 *               password:
 *                 type: string
 *                 description: The updated password.
 *                 example: newstrongpassword
 *     responses:
 *       200:
 *         description: The user was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 UserId:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: updated_user
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:userId', UserController.updateUser);

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:userId', UserController.deleteUser);

module.exports = router; 