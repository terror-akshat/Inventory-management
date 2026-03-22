const express = require('express');
const router = express.Router();
const { getSalesReport, getStockReport, getLowStockReport, getPurchaseReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/sales', getSalesReport);
router.get('/stock', getStockReport);
router.get('/low-stock', getLowStockReport);
router.get('/purchases', getPurchaseReport);

module.exports = router;
