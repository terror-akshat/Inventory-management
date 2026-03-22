const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, getCategories, getLowStockProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const paginate = require('../middleware/paginate');

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('price').isNumeric().withMessage('Price must be a number')
];

router.use(protect);

router.get('/', paginate, getProducts);
router.get('/categories', getCategories);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProduct);
router.post('/', authorize('admin'), productValidation, createProduct);
router.put('/:id', authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
