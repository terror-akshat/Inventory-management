const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

const customerValidation = [
  body('name').trim().notEmpty().withMessage('Customer name is required')
];

router.use(protect);
router.get('/', paginate, getCustomers);
router.get('/:id', getCustomer);
router.post('/', customerValidation, createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;