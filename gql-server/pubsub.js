
// import { PubSub } from 'graphql-subscriptions';
// export const graphqlPubsub = new PubSub();


import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const redisOptions = {
  host: process.env.REDIS_PUBSUB_HOST,
  port: process.env.REDIS_PUBSUB_PORT,
  password: process.env.REDIS_PUBSUB_PASSWORD
};

export const graphqlPubsub = new RedisPubSub({
  publisher: new Redis(redisOptions.host, redisOptions.port, {
    password: redisOptions.password
  }).on("error", (err) => {
    console.log("Redis publisher db error", err);
  }),

  subscriber: new Redis(redisOptions.host, redisOptions.port, {
    password: redisOptions.password
  }).on("error", (err) => {
    console.log("Redis subscriber db error", err);
  })
});
