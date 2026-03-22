const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalProducts,
      totalSuppliers,
      totalCustomers,
      lowStockProducts,
      monthlyRevenue,
      lastMonthRevenue,
      recentTransactions,
      topProducts,
      monthlyChart
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
      Product.find({
        isActive: true,
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
      }).select('name quantity lowStockThreshold sku').limit(10),
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed', date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed', date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Transaction.find({ status: 'completed' })
        .populate('customer', 'name')
        .populate('supplier', 'name')
        .sort('-date')
        .limit(5)
        .select('transactionId type totalAmount date customer supplier'),
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.totalPrice' } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', totalSold: 1, revenue: 1 } }
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed', date: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) } } },
        { $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' },
          total: { $sum: '$totalAmount' }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const stockValue = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price'] } } } }
    ]);

    const currentRevenue = monthlyRevenue[0]?.total || 0;
    const prevRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = prevRevenue ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalSuppliers,
        totalCustomers,
        lowStockCount: lowStockProducts.length,
        monthlyRevenue: currentRevenue,
        monthlySales: monthlyRevenue[0]?.count || 0,
        revenueGrowth,
        totalStockValue: stockValue[0]?.total || 0
      },
      lowStockProducts,
      recentTransactions,
      topProducts,
      chartData: monthlyChart
    });
  } catch (error) {
    next(error);
  }
};
