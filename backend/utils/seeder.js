const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Transaction.deleteMany({})
    ]);
    console.log('Cleared existing data');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@inventory.com',
      password: 'admin123',
      role: 'admin'
    });

    const staff = await User.create({
      name: 'Staff User',
      email: 'staff@inventory.com',
      password: 'staff123',
      role: 'staff'
    });

    console.log('Created users');

    const suppliers = await Supplier.insertMany([
      { name: 'TechSupply Co', email: 'tech@supply.com', phone: '555-0101', contactPerson: 'John Smith', address: { city: 'New York', country: 'USA' } },
      { name: 'GlobalGoods Ltd', email: 'info@globalgoods.com', phone: '555-0102', contactPerson: 'Sarah Johnson', address: { city: 'London', country: 'UK' } },
      { name: 'QuickStock Inc', email: 'quick@stock.com', phone: '555-0103', contactPerson: 'Mike Chen', address: { city: 'Singapore', country: 'SG' } },
    ]);
    console.log('Created suppliers');

    const products = await Product.insertMany([
      { name: 'Laptop Pro 15', category: 'Electronics', quantity: 50, price: 1299.99, costPrice: 900, supplier: suppliers[0]._id, lowStockThreshold: 10, sku: 'SKU-00001' },
      { name: 'Wireless Mouse', category: 'Electronics', quantity: 200, price: 29.99, costPrice: 15, supplier: suppliers[0]._id, lowStockThreshold: 20, sku: 'SKU-00002' },
      { name: 'USB-C Hub', category: 'Electronics', quantity: 8, price: 49.99, costPrice: 25, supplier: suppliers[0]._id, lowStockThreshold: 15, sku: 'SKU-00003' },
      { name: 'Office Chair', category: 'Furniture', quantity: 30, price: 299.99, costPrice: 180, supplier: suppliers[1]._id, lowStockThreshold: 5, sku: 'SKU-00004' },
      { name: 'Standing Desk', category: 'Furniture', quantity: 4, price: 549.99, costPrice: 300, supplier: suppliers[1]._id, lowStockThreshold: 5, sku: 'SKU-00005' },
      { name: 'Printer Paper A4', category: 'Stationery', quantity: 500, price: 9.99, costPrice: 5, supplier: suppliers[2]._id, lowStockThreshold: 50, sku: 'SKU-00006' },
      { name: 'Ballpoint Pens Box', category: 'Stationery', quantity: 12, price: 4.99, costPrice: 2, supplier: suppliers[2]._id, lowStockThreshold: 20, sku: 'SKU-00007' },
      { name: 'Monitor 27 inch', category: 'Electronics', quantity: 25, price: 399.99, costPrice: 250, supplier: suppliers[0]._id, lowStockThreshold: 8, sku: 'SKU-00008' },
      { name: 'Mechanical Keyboard', category: 'Electronics', quantity: 6, price: 149.99, costPrice: 80, supplier: suppliers[0]._id, lowStockThreshold: 10, sku: 'SKU-00009' },
      { name: 'Webcam HD', category: 'Electronics', quantity: 45, price: 79.99, costPrice: 40, supplier: suppliers[2]._id, lowStockThreshold: 10, sku: 'SKU-00010' },
    ]);
    console.log('Created products');

    const customers = await Customer.insertMany([
      { name: 'Acme Corporation', email: 'procurement@acme.com', phone: '555-1001', address: { city: 'Chicago', country: 'USA' } },
      { name: 'Bright Solutions', email: 'orders@bright.com', phone: '555-1002', address: { city: 'Toronto', country: 'Canada' } },
      { name: 'Nexus Tech', email: 'supply@nexus.com', phone: '555-1003', address: { city: 'Austin', country: 'USA' } },
    ]);
    console.log('Created customers');

    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 3);

      await Transaction.create({
        type: 'sale',
        items: [
          { product: products[0]._id, productName: products[0].name, quantity: 2, unitPrice: 1299.99, totalPrice: 2599.98 },
          { product: products[1]._id, productName: products[1].name, quantity: 5, unitPrice: 29.99, totalPrice: 149.95 }
        ],
        totalAmount: 2749.93,
        customer: customers[i % 3]._id,
        createdBy: admin._id,
        date
      });
    }

    await Transaction.create({
      type: 'purchase',
      items: [
        { product: products[2]._id, productName: products[2].name, quantity: 50, unitPrice: 25, totalPrice: 1250 }
      ],
      totalAmount: 1250,
      supplier: suppliers[0]._id,
      createdBy: admin._id
    });

    console.log('Created transactions');
    console.log('\n✅ Seed completed successfully!');
    console.log('📧 Admin: admin@inventory.com / admin123');
    console.log('📧 Staff: staff@inventory.com / staff123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();