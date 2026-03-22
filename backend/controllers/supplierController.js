const { validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

exports.getSuppliers = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { search, sort = '-createdAt' } = req.query;

    const query = { isActive: true };
    if (search) query.$text = { $search: search };

    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort(sort).skip(skip).limit(limit),
      Supplier.countDocuments(query)
    ]);

    res.json({ success: true, count: suppliers.length, total, page, pages: Math.ceil(total / limit), suppliers });
  } catch (error) {
    next(error);
  }
};

exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    const products = await Product.find({ supplier: req.params.id, isActive: true })
      .select('name sku quantity price');

    res.json({ success: true, supplier, products });
  } catch (error) {
    next(error);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, message: 'Supplier created successfully', supplier });
  } catch (error) {
    next(error);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier updated successfully', supplier });
  } catch (error) {
    next(error);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};
