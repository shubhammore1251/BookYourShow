import redis from "@/lib/redis";

export class CacheService {
  static TTL = {
    SHOWTIMES: 300,       // 5 minutes
    AVAILABLE_DATES: 600, // 10 minutes
    SHOW_TYPES: 1800,     // 30 minutes
  };

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Redis INVALIDATE error:', error);
    }
  }

  static keys = {
    showtimes: (movieId: number, date: string, location: string, showType: string) =>
      `showtimes:${movieId}:${date}:${location}:${showType}`,
    
    availableDates: (movieId: number, location: string) =>
      `dates:${movieId}:${location}`,
    
    showTypes: (movieId: number) => `showtypes:${movieId}`,
  };
}
