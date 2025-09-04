import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const server = new McpServer({
  name: "gemini-image-generator",
  version: "1.0.0",
});

server.registerTool("generate_image", {
  title: "Generate Image",
  description: "Generates an image from a text prompt using the gemini-2.5-flash-image-preview model.",
  inputSchema: {
    prompt: z.string().describe("The text prompt describing the image to generate."),
  },
  async run({ prompt }, context) {
    const apiKey = context.server.props.get("gemini_api_key");
    if (!apiKey) {
      return { content: [{ type: "text", text: "Error: Gemini API key not configured." }] };
    }
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
      const result = await model.generateContent([prompt]);
      const response = result.response;
      const imagePart = response.parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));
      if (!imagePart) {
        return { content: [{ type: "text", text: "Error: No image data returned from API." }] };
      }
      const base64Image = Buffer.from(imagePart.inlineData.data, 'binary').toString('base64');
      return {
        content: [{
          type: "text",
          text: `Image generated: data:${imagePart.inlineData.mimeType};base64,${base64Image}`,
        }],
      };
    } catch (e) {
      console.error(e);
      return { content: [{ type: "text", text: `An error occurred: ${e.message}` }] };
    }
  },
});

// Create and export the runner function for the modern SDK
export const run = server.createRunner(new StdioServerTransport());

// Run the server if the script is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log("Gemini Image Generation MCP Server starting...");
  run();
}