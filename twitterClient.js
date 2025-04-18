import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";

dotenv.config();

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_KEY_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const bearer = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

const twitterClient = client.readWrite;
const twitterBearer = bearer.readOnly;

export { twitterClient, twitterBearer };