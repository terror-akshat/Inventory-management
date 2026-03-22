const mongoose = require("mongoose");
require("dotenv").config();

const { seedDatabase } = require("./seedData");

const seed = async () => {
  try {
    await mongoose.connect("mongodb+srv://xyz_123:xyz_123@cluster0.4hgakcp.mongodb.net/?appName=Cluster0");
    console.log("Connected to MongoDB");

    const result = await seedDatabase({ wipeExisting: true });

    if (result.seeded) {
      console.log("\nSeed completed successfully!");
      console.log(
        `Admin: ${result.credentials.admin.email} / ${result.credentials.admin.password}`,
      );
      console.log(
        `Staff: ${result.credentials.staff.email} / ${result.credentials.staff.password}`,
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();
