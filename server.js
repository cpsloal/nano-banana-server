import { McpServer, runStdioServer } from "@modelcontextprotocol/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// 1. Create and configure the MCP server instance
const server = new McpServer({
  name: "gemini-image-generator",
  version: "1.2.0",
  tools: {
    generate_image: {
      title: "Generate Image",
      description: "Generates an image from a text prompt using the gemini-2.5-flash-image-preview model.",
      inputSchema: z.object({
        prompt: z.string().describe("The text prompt describing the image to generate."),
      }),
      
      async run({ prompt }, context) {
        const apiKey = context.server.props.get("gemini_api_key");
        if (!apiKey) {
          return { content: [{ type: "text", text: "Error: Gemini API key not configured in the MCP server properties." }] };
        }
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
          const result = await model.generateContent([prompt]);
          const response = result.response;
          const imagePart = response.parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));
          
          if (!imagePart) {
            return { content: [{ type: "text", text: "Error: No image data returned from the API." }] };
          }
    
          const base64Image = Buffer.from(imagePart.inlineData.data, 'binary').toString('base64');
          
          return {
            content: [{
              type: "text",
              text: `Image generated successfully. data:${imagePart.inlineData.mimeType};base64,${base64Image}`,
            }],
          };
        } catch (e) {
          console.error(e);
          return { content: [{ type: "text", text: `An error occurred: ${e.message}` }] };
        }
      },
    },
  },
});

// 3. Start the server using the correct top-level function
console.log("Gemini Image Generation MCP Server starting...");
runStdioServer(server);