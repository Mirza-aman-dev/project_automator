import "dotenv/config";
import Redis from "ioredis";

const redisOptions = {
  host: process.env.REDIS_PUBSUB_HOST,
  port: process.env.REDIS_PUBSUB_PORT,
  password: process.env.REDIS_PUBSUB_PASSWORD,
};

// Create reusable redis client
const redisClient = new Redis(redisOptions);

redisClient.on("connect", () => {
  // console.log('Redis db Connected');
});
redisClient.on("ready", () => {
  console.log("Redis db ready");
});
redisClient.on("reconnecting", () => {
  // console.log('Redis db Reconnecting');
});
redisClient.on("error", () => {
  console.log("Redis db error");
});

export default redisClient;


// health check
export async function healthCheck () {
  return new Promise((resolve) => {
    try {
      redisClient.ping().then((res) => {
        if (res === 'PONG') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.log('redisClient error:', error);
      resolve(false);
    }
  });
}
