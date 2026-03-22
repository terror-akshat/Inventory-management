const { validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

exports.getCustomers = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, sort = '-createdAt' } = req.query;

    const query = { isActive: true };
    if (search) query.$text = { $search: search };

    const [customers, total] = await Promise.all([
      Customer.find(query).sort(sort).skip(skip).limit(limit),
      Customer.countDocuments(query)
    ]);

    res.json({ success: true, count: customers.length, total, page, pages: Math.ceil(total / limit), customers });
  } catch (error) {
    next(error);
  }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const transactions = await Transaction.find({ customer: req.params.id, type: 'sale' })
      .sort('-date').limit(10)
      .populate('items.product', 'name sku');

    res.json({ success: true, customer, transactions });
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, message: 'Customer created successfully', customer });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer updated successfully', customer });
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
