import readline from 'readline/promises';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Load environment variables early
dotenv.config();

let tools = [];

// Create transport for MCP
const transport = new StdioClientTransport({
    command: "node",
    args: ["tool.js"]
});

// Create MCP client
const client = new Client({
    name: "example-client",
    version: "1.0.0"
});

// Initialize Google Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Store chat history
const chatHistory = [];

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Main chat function with proper recursion handling
async function chatLoop(toolCall = null) {
    try {
        // Handle tool calls if present
        if (toolCall) {
            console.log("Tool call:", toolCall);
            const response = await client.callTool({
                name: toolCall.name,
                arguments: toolCall.args
            });

            const responseText = response.content[0].text;
            console.log("Tool response:", responseText);
            chatHistory.push({ role: 'assistant', parts: [{ text: responseText }] });
            return chatLoop(); // Continue chat after tool response
        }

        // Get user input
        const question = await rl.question('You: ');

        // Exit condition
        if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
            console.log('Goodbye!');
            rl.close();
            process.exit(0);
            return;
        }

        chatHistory.push({ role: 'user', parts: [{ text: question }] });

        // Get AI response
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: chatHistory,
            config: {
                tools: [{
                    functionDeclarations: tools
                }]
            }
        });

        // Handle function calls
        const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
        if (functionCall) {
            return chatLoop(functionCall); // Continue with tool call
        } else {
            const responses = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: chatHistory,
            });
            console.log(`AI: ${responses.text}`);
            chatHistory.push({ role: 'assistant', parts: [{ text: responses.text }] });
            return chatLoop(); // Continue chat
        }
    } catch (error) {
        console.error("Error in chat loop:", error);
        return chatLoop(); // Continue despite error
    }
}

// Connect to MCP server and start chat
client.connect(transport)
    .then(async () => {
        console.log("Connected to MCP server");
        // Get available tools
        const toolList = await client.listTools();
        tools = toolList.tools.map(tool => {
            return {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.inputSchema.type,
                    properties: tool.inputSchema.properties,
                    required: tool.inputSchema.required,
                }
            };
        });
        console.log(`Loaded ${tools.length} tools`);

        // Start chat loop
        chatLoop();
    })
    .catch((err) => {
        console.error("Error connecting to server:", err);
        process.exit(1);
    });
