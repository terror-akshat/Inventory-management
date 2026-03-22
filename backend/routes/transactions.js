const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getTransactions, getTransaction, createTransaction, deleteTransaction } = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

const transactionValidation = [
  body('type').isIn(['purchase', 'sale']).withMessage('Type must be purchase or sale'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

router.use(protect);
router.get('/', paginate, getTransactions);
router.get('/:id', getTransaction);
router.post('/', transactionValidation, createTransaction);
router.delete('/:id', authorize('admin'), deleteTransaction);

module.exports = router;
