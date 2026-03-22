const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

const supplierValidation = [
  body('name').trim().notEmpty().withMessage('Supplier name is required')
];

router.use(protect);
router.get('/', paginate, getSuppliers);
router.get('/:id', getSupplier);
router.post('/', authorize('admin'), supplierValidation, createSupplier);
router.put('/:id', authorize('admin'), updateSupplier);
router.delete('/:id', authorize('admin'), deleteSupplier);

module.exports = router;
