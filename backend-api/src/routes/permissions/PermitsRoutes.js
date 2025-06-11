const express = require('express');
const PermitsController = require('../../controllers/permissions/PermitsController');

const router = express.Router();

router.post('/', PermitsController.createPermit);
router.get('/:PermitId', PermitsController.getPermitById);
router.get('/', PermitsController.getAllPermits);
router.put('/:PermitId', PermitsController.updatePermit);
router.delete('/:PermitId', PermitsController.deletePermit);

module.exports = router; 