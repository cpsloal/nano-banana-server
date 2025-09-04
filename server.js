import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// 1. Create and configure the MCP server
const server = new McpServer({
  name: "nano-banana-image-generator",
  version: "1.0.0",
});

// 2. Define the image generation tool
server.registerTool("generate_image", {
  title: "Generate Image",
  description: "Generates an image from a text prompt using the gemini-2.5-flash-image-preview (aka nano-banana) model.",
  inputSchema: {
    prompt: z.string().describe("The text prompt describing the image to generate."),
  },
  
  // 3. Implement the tool's execution logic
  async run({ prompt }, context) {
    // Access the API key from server properties provided in mcp.json
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
      
      // Assuming the image data is in the first part of the response
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

// 4. Start the server using standard I/O for communication
server.listen(new StdioServerTransport());
console.log("Gemini Image Generation MCP Server is running.");