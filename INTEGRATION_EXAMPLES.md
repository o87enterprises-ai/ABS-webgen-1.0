# DeepSite Integration Examples

This guide shows how to use DeepSite's prompt engineering with other AI systems.

## Table of Contents
1. [MCP Server for Claude Desktop](#mcp-server-for-claude-desktop)
2. [Standalone Script with Anthropic API](#standalone-script-with-anthropic-api)
3. [OpenAI API Integration](#openai-api-integration)
4. [Local LLM (Ollama) Integration](#local-llm-ollama-integration)

---

## MCP Server for Claude Desktop

Create a Model Context Protocol server that exposes DeepSite's website generation capabilities to Claude Desktop.

### Setup

```bash
# Create new MCP server project
mkdir mcp-deepsite-server
cd mcp-deepsite-server
npm init -y
npm install @modelcontextprotocol/sdk
```

### Server Implementation

**File: `index.js`**

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// DeepSite's system prompts (extracted from lib/prompts.ts)
const DEEPSITE_INITIAL_PROMPT = `You are an expert UI/UX and Front-End Developer.
You create website in a way a designer would, using ONLY HTML, CSS and Javascript.
Try to create the best UI possible. Important: Make the website responsive by using TailwindCSS. Use it as much as you can, if you can't use it, use custom css (make sure to import tailwind with <script src="https://cdn.tailwindcss.com"></script> in the head).
Also try to elaborate as much as you can, to create something unique, with a great design.
If you want to use ICONS import Feather Icons (Make sure to add <script src="https://unpkg.com/feather-icons"></script> and <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script> in the head., and <script>feather.replace();</script> in the body. Ex : <i data-feather="user"></i>).
For interactive animations you can use: Vanta.js (Make sure to add <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js"></script> and <script>VANTA.GLOBE({...</script> in the body.).
Don't hesitate to use real public API for the datas, you can find good ones here https://github.com/public-apis/public-apis depending on what the user asks for.
You can create multiple pages website at once or a Single Page Application. But make sure to create multiple pages if the user asks for different pages.

For images, use http://Static.photos Usage:
Format: http://static.photos/[category]/[dimensions]/[seed] where dimensions must be one of: 200x200, 320x240, 640x360, 1024x576, or 1200x630; seed can be any number (1-999+) for consistent images or omit for random; categories include: nature, office, people, technology, minimal, abstract, aerial, blurred, bokeh, gradient, monochrome, vintage, white, black, blue, red, green, yellow, cityscape, workspace, food, travel, textures, industry, indoor, outdoor, studio, finance, medical, season, holiday, event, sport, science, legal, estate, restaurant, retail, wellness, agriculture, construction, craft, cosmetic, automotive, gaming, or education.

No need to explain what you did. Just return the expected result. AVOID Chinese characters in the code if not asked by the user.
Return the results in a \`\`\`html\`\`\` markdown. Return a complete, working HTML file with all necessary CDN links.`;

const DEEPSITE_EDIT_PROMPT = `You are an expert UI/UX and Front-End Developer modifying an existing HTML file.
The user wants to apply changes and probably add new features to the website, based on their request.
You MUST output the complete updated HTML file, not just the changes.
Don't hesitate to use real public API for the datas, you can find good ones here https://github.com/public-apis/public-apis depending on what the user asks for.
Do NOT explain the changes or what you did, just return the expected results in \`\`\`html\`\`\` markdown.`;

// Create MCP server
const server = new Server(
  {
    name: "deepsite",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_website",
        description:
          "Generate a complete HTML/CSS/JS website from a text description. Uses DeepSite's proven prompt engineering to create responsive, beautiful websites with TailwindCSS.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description:
                "Description of the website to generate (e.g., 'Create a landing page for a SaaS product with pricing section')",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "edit_website",
        description:
          "Modify an existing HTML website based on a change request.",
        inputSchema: {
          type: "object",
          properties: {
            current_html: {
              type: "string",
              description: "The current HTML code to modify",
            },
            change_request: {
              type: "string",
              description:
                "What changes to make (e.g., 'Change the header to dark mode')",
            },
          },
          required: ["current_html", "change_request"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "generate_website") {
    const { prompt } = request.params.arguments;

    return {
      content: [
        {
          type: "text",
          text: `I'll generate a website using DeepSite's methodology. Send this prompt to your AI:

SYSTEM: ${DEEPSITE_INITIAL_PROMPT}

USER: ${prompt}

The AI should return complete HTML code. Save it as an .html file to view.`,
        },
      ],
    };
  }

  if (request.params.name === "edit_website") {
    const { current_html, change_request } = request.params.arguments;

    return {
      content: [
        {
          type: "text",
          text: `I'll modify the website using DeepSite's methodology. Send this to your AI:

SYSTEM: ${DEEPSITE_EDIT_PROMPT}

USER: Here's the current HTML:

\`\`\`html
${current_html}
\`\`\`

Please make the following changes: ${change_request}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("DeepSite MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### Claude Desktop Configuration

**File: `~/Library/Application Support/Claude/claude_desktop_config.json`** (macOS)

```json
{
  "mcpServers": {
    "deepsite": {
      "command": "node",
      "args": ["/path/to/mcp-deepsite-server/index.js"]
    }
  }
}
```

### Usage in Claude Desktop

```
User: Use the generate_website tool to create a landing page for a coffee shop

Claude: [Calls MCP tool, gets prompt template, generates HTML]

User: Now use edit_website to add a menu section

Claude: [Calls edit tool with current HTML + change request]
```

---

## Standalone Script with Anthropic API

Use DeepSite's prompts directly with Claude API (no MCP required).

### Setup

```bash
npm install @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-ant-xxx
```

### Implementation

**File: `generate-website.js`**

```javascript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEEPSITE_SYSTEM_PROMPT = `You are an expert UI/UX and Front-End Developer.
You create websites using ONLY HTML, CSS and Javascript.
Make the website responsive by using TailwindCSS (use <script src="https://cdn.tailwindcss.com"></script>).
For icons, use Feather Icons (<script src="https://unpkg.com/feather-icons"></script>).
For images, use http://static.photos/[category]/[dimensions]/[seed].
Return complete HTML in \`\`\`html markdown blocks. No explanations, just code.`;

async function generateWebsite(prompt) {
  console.log("Generating website...");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system: DEEPSITE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const response = message.content[0].text;

  // Extract HTML from markdown code block
  const htmlMatch = response.match(/```html\n([\s\S]*?)\n```/);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  return response;
}

async function editWebsite(currentHtml, changeRequest) {
  console.log("Editing website...");

  const editPrompt = `You are modifying an existing HTML file.
Output the complete updated HTML, not just changes.
Return in \`\`\`html markdown blocks.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system: editPrompt,
    messages: [
      {
        role: "user",
        content: `Current HTML:\n\`\`\`html\n${currentHtml}\n\`\`\`\n\nChanges: ${changeRequest}`,
      },
    ],
  });

  const response = message.content[0].text;
  const htmlMatch = response.match(/```html\n([\s\S]*?)\n```/);
  return htmlMatch ? htmlMatch[1] : response;
}

// Example usage
const html = await generateWebsite(
  "Create a landing page for a SaaS product with hero, features, and pricing sections"
);

console.log(html);

// Save to file
import { writeFileSync } from "fs";
writeFileSync("output.html", html);
console.log("Saved to output.html");
```

### Run It

```bash
node generate-website.js
open output.html  # Opens in browser
```

---

## OpenAI API Integration

Use DeepSite's prompts with OpenAI GPT-4.

### Setup

```bash
npm install openai
export OPENAI_API_KEY=sk-xxx
```

### Implementation

**File: `generate-website-openai.js`**

```javascript
import OpenAI from "openai";
import { writeFileSync } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEEPSITE_SYSTEM_PROMPT = `You are an expert UI/UX and Front-End Developer.
Create responsive websites using HTML, CSS, JavaScript, and TailwindCSS.
Use <script src="https://cdn.tailwindcss.com"></script> for styling.
Use <script src="https://unpkg.com/feather-icons"></script> for icons.
For images: http://static.photos/[category]/[width]x[height]/[seed]
Return complete HTML in \`\`\`html code blocks. No explanations.`;

async function generateWebsite(prompt) {
  console.log("Generating with GPT-4...");

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content: DEEPSITE_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const response = completion.choices[0].message.content;

  // Extract HTML
  const htmlMatch = response.match(/```html\n([\s\S]*?)\n```/);
  return htmlMatch ? htmlMatch[1] : response;
}

// Use it
const html = await generateWebsite(
  "Create a portfolio website for a photographer with gallery grid"
);

writeFileSync("portfolio.html", html);
console.log("✅ Saved to portfolio.html");
```

---

## Local LLM (Ollama) Integration

Use DeepSite's prompts with locally-run models (free, private, offline).

### Setup

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a coding model
ollama pull deepseek-coder:33b
# or
ollama pull qwen2.5-coder:32b
```

### Implementation

**File: `generate-website-ollama.js`**

```javascript
async function generateWebsite(prompt) {
  const systemPrompt = `You are an expert web developer.
Create responsive websites using HTML, CSS, JavaScript, and TailwindCSS.
Use CDN: <script src="https://cdn.tailwindcss.com"></script>
Icons: <script src="https://unpkg.com/feather-icons"></script>
Images: http://static.photos/nature/640x360/42
Return complete HTML in \`\`\`html blocks.`;

  console.log("Generating with Ollama (deepseek-coder:33b)...");

  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-coder:33b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: false,
    }),
  });

  const data = await response.json();
  const fullResponse = data.message.content;

  // Extract HTML
  const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)\n```/);
  return htmlMatch ? htmlMatch[1] : fullResponse;
}

// Use it
const html = await generateWebsite(
  "Create a todo list app with add, delete, and mark complete features"
);

import { writeFileSync } from "fs";
writeFileSync("todo-app.html", html);
console.log("✅ Saved to todo-app.html");
```

### Run It

```bash
# Make sure Ollama is running
ollama serve

# In another terminal
node generate-website-ollama.js
```

---

## Comparison Table

| Method | Cost | Speed | Quality | Privacy | Setup |
|--------|------|-------|---------|---------|-------|
| **HuggingFace (Original)** | $ | ⚡⚡⚡ | ⭐⭐⭐⭐ | ☁️ | Easy |
| **Anthropic (Claude)** | $$$ | ⚡⚡ | ⭐⭐⭐⭐⭐ | ☁️ | Easy |
| **OpenAI (GPT-4)** | $$ | ⚡⚡ | ⭐⭐⭐⭐ | ☁️ | Easy |
| **Ollama (Local)** | Free | ⚡ | ⭐⭐⭐ | 🔒 | Medium |

---

## Best Practices

### 1. Prompt Engineering Tips

**Be Specific:**
```
❌ "Create a website"
✅ "Create a landing page for a SaaS product with hero section, 3 feature cards, pricing table, and footer"
```

**Reference Styles:**
```
✅ "Create a dark mode dashboard with sidebar navigation, inspired by Stripe's design"
```

**Specify Libraries:**
```
✅ "Create a weather app using the OpenWeatherMap API (https://api.openweathermap.org/data/2.5/weather)"
```

### 2. Iteration Strategy

**First Prompt: Get Structure**
```
"Create a portfolio website with navigation, hero, projects grid, about, and contact form"
```

**Second Prompt: Refine Details**
```
"Make the hero section full-screen with animated gradient background. Add hover effects to project cards."
```

**Third Prompt: Add Functionality**
```
"Make the contact form functional using Formspree (https://formspree.io/f/YOUR_FORM_ID)"
```

### 3. Model Selection

**For Creative Designs:**
- Claude Sonnet (Anthropic)
- Qwen3-Coder (HuggingFace)

**For Fast Iteration:**
- DeepSeek V3 (HuggingFace)
- GPT-4 Turbo (OpenAI)

**For Local/Private:**
- DeepSeek-Coder 33B (Ollama)
- Qwen2.5-Coder 32B (Ollama)

---

## Troubleshooting

### HTML Not Rendering Correctly

**Issue:** Styles not loading

**Fix:** Ensure CDN links are in `<head>`:
```html
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/feather-icons"></script>
```

### Icons Not Showing

**Issue:** Feather icons appear as text

**Fix:** Add before closing `</body>`:
```html
<script>feather.replace();</script>
```

### Images Broken

**Issue:** http://static.photos returns 404

**Fix:** Use valid dimensions:
- 200x200, 320x240, 640x360, 1024x576, or 1200x630

**Example:**
```
✅ http://static.photos/nature/640x360/42
❌ http://static.photos/nature/500x500/42
```

### API Errors

**HuggingFace:**
```javascript
// Add better error handling
try {
  const response = await generateWebsite(prompt);
} catch (error) {
  if (error.message.includes('exceeded your monthly included credits')) {
    console.error('HF credits exhausted. Consider HF Pro or switch to local model.');
  }
}
```

---

## Resources

- **DeepSite Prompts**: See `lib/prompts.ts` in this repo
- **MCP Docs**: https://modelcontextprotocol.io
- **Anthropic API**: https://docs.anthropic.com/claude/reference/getting-started
- **OpenAI API**: https://platform.openai.com/docs/api-reference
- **Ollama Models**: https://ollama.com/library
- **Static.photos Docs**: http://static.photos

---

## Next Steps

1. **Test Examples**: Try each integration method
2. **Customize Prompts**: Adjust system prompts for your use case
3. **Build MCP Server**: Package as reusable tool for Claude Desktop
4. **Combine Approaches**: Use Claude for generation, local model for edits

Happy coding! 🚀
