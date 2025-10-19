import { getRandomInt } from "@/cronjobs/cronFunction";

export const cronConfig = [
  {
    schedule: "*/1 * * * *",
    job: async () => {
      console.log("Reached here");
      const randomNumber = getRandomInt(1, 100);
      console.log(`Random number: ${randomNumber}`);
    },
  },
];
