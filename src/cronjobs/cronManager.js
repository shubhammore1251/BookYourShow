import { CronJob } from "cron";
import { cronConfig } from "@/cronjobs/cronConfig";

class CronManager {
  constructor() {
    this.jobs = [];
  }

  addJobsFromConfig() {
    console.log("reached here");
    cronConfig.forEach((config) => {
      const { schedule, job } = config;
      const cronJob = new CronJob(schedule, job, null, true, "UTC");
      this.jobs.push(cronJob);
    });
  }

  startJobs() {
    console.log("reached here 2");
    this.jobs.forEach((job) => {
      job.start();
    });
  }
}

export default CronManager;
