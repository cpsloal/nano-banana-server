// No shebang needed at the top
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// 1. Create and configure the MCP server
const server = new McpServer({
  name: "gemini-image-generator",
  version: "1.0.0",
});

// 2. Define the image generation tool
server.registerTool("generate_image", {
  title: "Generate Image",
  description: "Generates an image from a text prompt using the gemini-2.5-flash-image-preview model.",
  inputSchema: {
    prompt: z.string().describe("The text prompt describing the image to generate."),
  },

  // 3. Implement the tool's execution logic
  async run({ prompt }, context) {
    const apiKey = context.server.props.get("gemini_api_key");

    if (!apiKey) {
      return {
        content: [{
          type: "text",
          text: "Error: Gemini API key not configured in the MCP server properties.",
        }],
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

      const result = await model.generateContent([prompt]);
      const response = result.response;

      const imagePart = response.parts.find(part => part.inlineData && part.inlineData.mimeType.startsWith('image/'));
      
      if (!imagePart) {
        return { content: [{ type: "text", text: "Error: No image data returned from the API." }] };
      }

      const base64Image = Buffer.from(imagePart.inlineData.data, 'binary').toString('base64');
      
      return {
        content: [{
          type: "text",
          text: `Image generated successfully. Here is the base64 encoded image data: data:${imagePart.inlineData.mimeType};base64,${base64Image}`,
        }],
      };

    } catch (e) {
      console.error(e);
      return {
        content: [{
          type: "text",
          text: `An error occurred while generating the image: ${e.message}`,
        }],
      };
    }
  },
});

// 4. Create and export the runner function (THE FIX IS HERE)
export const run = server.createRunner(new StdioServerTransport());

// 5. Run the server if the script is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log("Gemini Image Generation MCP Server starting...");
  run();
}