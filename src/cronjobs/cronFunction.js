import { deleteExpiredShows, generateShowsOptimized } from "@/lib/scheduleShows";

export async function scheduleMovies() {
  console.log("Starting show update cron job...");

  // Step 1: Delete expired shows
  const deletedCount = await deleteExpiredShows();

  console.log(`Deleted ${deletedCount} expired shows`);

  // Step 2: Generate new shows
  const { created, skipped } = await generateShowsOptimized();

  console.log(`Generated ${created} new shows`);
  console.log(`Skipped ${skipped} shows due to existing ones`);

  console.log("Cron job completed successfully");
}
