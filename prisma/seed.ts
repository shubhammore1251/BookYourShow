import prisma from "@/lib/prisma";
import { theatersData } from "@/data/theaters";

async function main() {
  console.log("🌱 Starting seed...\n");

  // Seed Theaters
  for (const theaterData of theatersData) {
    const { screens, ...theaterInfo } = theaterData;

    // Check if theater exists
    const existingTheater = await prisma.theater.findFirst({
      where: {
        name: theaterInfo.name,
        city: theaterInfo.city,
        location: theaterInfo.location,
      },
    });

    if (!existingTheater) {
      await prisma.theater.create({
        data: {
          ...theaterInfo,
          screens: {
            create: screens,
          },
        },
      });
      console.log(`✅ Theater added: ${theaterInfo.name}, ${theaterInfo.city}`);
    } else {
      console.log(
        `⏭️  Theater skipped (already exists): ${theaterInfo.name}, ${theaterInfo.city}`
      );
    }
  }

  console.log("\n");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
