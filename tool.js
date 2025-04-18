import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from 'dotenv';
import { twitterClient } from "./twitterClient.js";

// Load environment variables early
dotenv.config();

// Create an MCP server
const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});


export async function createPost(status) {
    console.log(status);
    try {
        const newPost = await twitterClient.v2.tweet(status);
        console.log(newPost);

        return {
            content: [
                {
                    type: "text",
                    text: `Tweeted: ${status}`
                }
            ]
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error posting tweet: ${error.message}`
                }
            ]
        };
    }
}

// Add an addition tool
server.tool("add",
    "Add two numbers together",
    { a: z.number(), b: z.number() },
    async ({ a, b }) => ({
        content: [{ type: "text", text: `Result is ${a + b}` }]
    })
);

server.tool("createTwitterPost",

    "Create a post on X formally known as Twitter",
    {
        status: z.string()
    },
    async ({ status }) => {
        await twitterClient.v2.tweet(status);
        return {
            content: [{ type: "text", text: `Post created: ${status}` }]
        };
    }
);

server.tool("getTwitterPosts",
    "Get the latest posts from X formally known as Twitter",
    {},
    async () => {
        const posts = await twitterClient.v2.get("posts");
        return { content: [{ type: "text", text: `Posts: ${posts}` }] };
    }
);


// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);