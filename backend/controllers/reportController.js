const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchQuery = { type: 'sale', status: 'completed' };
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate + 'T23:59:59');
    }

    const groupFormat = groupBy === 'month'
      ? { year: { $year: '$date' }, month: { $month: '$date' } }
      : { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } };

    const [salesData, summary] = await Promise.all([
      Transaction.aggregate([
        { $match: matchQuery },
        { $group: { _id: groupFormat, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Transaction.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalOrders: { $sum: 1 }, avgOrder: { $avg: '$totalAmount' } } }
      ])
    ]);

    res.json({ success: true, salesData, summary: summary[0] || {} });
  } catch (error) {
    next(error);
  }
};

exports.getStockReport = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;

    const [products, categoryStats] = await Promise.all([
      Product.find(query).populate('supplier', 'name').sort('category name'),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }},
        { $sort: { totalValue: -1 } }
      ])
    ]);

    res.json({ success: true, products, categoryStats });
  } catch (error) {
    next(error);
  }
};

exports.getLowStockReport = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).populate('supplier', 'name email phone').sort('quantity');

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

exports.getPurchaseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { type: 'purchase', status: 'completed' };
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate + 'T23:59:59');
    }

    const [purchases, summary] = await Promise.all([
      Transaction.find(matchQuery)
        .populate('supplier', 'name')
        .sort('-date').limit(100),
      Transaction.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, totalSpent: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({ success: true, purchases, summary: summary[0] || {} });
  } catch (error) {
    next(error);
  }
};
