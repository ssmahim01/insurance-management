import Redis from "ioredis";
import { envVars } from "./env";

export const redisClient = new Redis({
  host: envVars.REDIS_HOST,
  port: Number(envVars.REDIS_PORT),
  username: envVars.REDIS_USERNAME,
  password: envVars.REDIS_PASSWORD,

  maxRetriesPerRequest: 3,
  enableReadyCheck: true,

  tls: {},
});

redisClient.on("connect", () => {
  console.log("✅ Redis Connected");
});

redisClient.on("ready", () => {
  console.log("🚀 Redis Ready");
});

redisClient.on("error", (error) => {
  console.error("❌ Redis Error:", error);
});