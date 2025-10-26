import { deleteExpiredShows, generateShowsOptimized } from "@/lib/scheduleShows";

export async function deleteScheduledShows() {
  console.log("Starting scheduled show deletion cron job...");

  const deletedCount = await deleteExpiredShows();

  console.log(`Deleted ${deletedCount} expired shows`);

  console.log("Cron job completed successfully");
}

export async function scheduleMovies() {
  console.log("Starting show update cron job...");

  // Generate new shows
  const { created, skipped } = await generateShowsOptimized();

  console.log(`Generated ${created} new shows`);
  console.log(`Skipped ${skipped} shows due to existing ones`);

  console.log("Cron job completed successfully");
}
