const mongoose = require("mongoose");
require("dotenv").config();

const { seedDatabase } = require("./seedData");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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
