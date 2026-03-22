const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

exports.getTransactions = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { type, startDate, endDate, sort = '-date' } = req.query;

    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59');
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('customer', 'name email')
        .populate('supplier', 'name email')
        .populate('createdBy', 'name')
        .populate('items.product', 'name sku')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query)
    ]);

    res.json({ success: true, count: transactions.length, total, page, pages: Math.ceil(total / limit), transactions });
  } catch (error) {
    next(error);
  }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('supplier', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku category');

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { type, items, customer, supplier, notes } = req.body;

    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }

      if (type === 'sale' && product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`
        });
      }

      const unitPrice = item.unitPrice || (type === 'sale' ? product.price : product.costPrice);
      const totalPrice = unitPrice * item.quantity;

      const stockChange = type === 'purchase' ? item.quantity : -item.quantity;
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: stockChange } },
        { session }
      );

      processedItems.push({
        product: item.product,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      });

      totalAmount += totalPrice;
    }

    const transaction = await Transaction.create([{
      type, items: processedItems, totalAmount,
      customer, supplier, notes,
      createdBy: req.user._id
    }], { session });

    if (type === 'sale' && customer) {
      await Customer.findByIdAndUpdate(customer, {
        $inc: { totalPurchases: 1, totalSpent: totalAmount }
      }, { session });
    }


    const populated = await Transaction.findById(transaction[0]._id)
      .populate('customer', 'name')
      .populate('supplier', 'name')
      .populate('items.product', 'name sku');

    res.status(201).json({ success: true, message: 'Transaction recorded successfully', transaction: populated });
  } catch (error) {
    next(error);
  } finally {
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id, { status: 'cancelled' }, { new: true }
    );
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction cancelled' });
  } catch (error) {
    next(error);
  }
};
