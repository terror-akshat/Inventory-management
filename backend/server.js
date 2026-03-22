const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const supplierRoutes = require("./routes/suppliers");
const customerRoutes = require("./routes/customers");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const { seedDatabase } = require("./utils/seedData");

const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(mongoSanitize());
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);
app.use(
  cors({
    origin: "https://invenm.netlify.app",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));


app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Inventory API is running",
    timestamp: new Date(),
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_db",
    );
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(" MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const bootstrapSeedData = async () => {
  const shouldAutoSeed =
    process.env.AUTO_SEED_ON_EMPTY_DB === undefined ||
    process.env.AUTO_SEED_ON_EMPTY_DB === "true";

  if (!shouldAutoSeed) {
    console.log("Auto-seed on empty DB disabled");
    return;
  }

  const result = await seedDatabase();

  if (result.seeded) {
    console.log("Seeded starter data because the database was empty");
  } else {
    console.log("Skipped starter seed because data already exists");
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  bootstrapSeedData()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          ` Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`,
        );
      });
    })
    .catch((error) => {
      console.error(" Seed bootstrap error:", error.message);
      process.exit(1);
    });
});

module.exports = app;
