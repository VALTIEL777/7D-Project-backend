const express = require('express');
const DiggersController = require('../../controllers/permissions/DiggersController');

const router = express.Router();

router.post('/', DiggersController.createDigger);
router.get('/:diggerId', DiggersController.getDiggerById);
router.get('/', DiggersController.getAllDiggers);
router.put('/:diggerId', DiggersController.updateDigger);
router.delete('/:diggerId', DiggersController.deleteDigger);

module.exports = router; 