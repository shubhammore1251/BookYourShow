import Redis from "ioredis";

declare global {
  var __REDIS__: Redis | undefined;
}

let redis: Redis;

if (!global.__REDIS__) {
  redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
  global.__REDIS__ = redis;
} else {
  redis = global.__REDIS__;
}

export default redis;