#!/usr/bin/env node

/**
 * DeepSite Prompt Extractor
 *
 * Extracts DeepSite's valuable prompt engineering templates
 * for use in your own projects (Claude Desktop, MCP, custom scripts, etc.)
 *
 * Usage:
 *   node extract-prompts.js
 *
 * Output:
 *   - deepsite-prompts.json (structured JSON)
 *   - deepsite-prompts.md (readable markdown)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the prompts file
const promptsPath = join(__dirname, 'lib', 'prompts.ts');
const promptsContent = readFileSync(promptsPath, 'utf-8');

// Extract all exported constants
const extractExport = (name) => {
  const regex = new RegExp(`export const ${name} = \`([\\s\\S]*?)\`;`, 'm');
  const match = promptsContent.match(regex);
  return match ? match[1] : null;
};

const extractSimpleExport = (name) => {
  const regex = new RegExp(`export const ${name} = "([^"]+)";`, 'm');
  const match = promptsContent.match(regex);
  return match ? match[1] : null;
};

const extractNumberExport = (name) => {
  const regex = new RegExp(`export const ${name} = (\\d+);`, 'm');
  const match = promptsContent.match(regex);
  return match ? parseInt(match[1], 10) : null;
};

const extractArrayExport = (name) => {
  const regex = new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\];`, 'm');
  const match = promptsContent.match(regex);
  if (!match) return [];

  // Parse the array items (simple string array)
  const items = match[1].match(/"([^"]+)"/g);
  return items ? items.map(item => item.replace(/"/g, '')) : [];
};

// Extract all prompts and constants
const prompts = {
  // Formatting tags
  tags: {
    SEARCH_START: extractSimpleExport('SEARCH_START'),
    DIVIDER: extractSimpleExport('DIVIDER'),
    REPLACE_END: extractSimpleExport('REPLACE_END'),
    TITLE_PAGE_START: extractSimpleExport('TITLE_PAGE_START'),
    TITLE_PAGE_END: extractSimpleExport('TITLE_PAGE_END'),
    NEW_PAGE_START: extractSimpleExport('NEW_PAGE_START'),
    NEW_PAGE_END: extractSimpleExport('NEW_PAGE_END'),
    UPDATE_PAGE_START: extractSimpleExport('UPDATE_PAGE_START'),
    UPDATE_PAGE_END: extractSimpleExport('UPDATE_PAGE_END'),
    PROJECT_NAME_START: extractSimpleExport('PROJECT_NAME_START'),
    PROJECT_NAME_END: extractSimpleExport('PROJECT_NAME_END'),
  },

  // Configuration
  config: {
    MAX_REQUESTS_PER_IP: extractNumberExport('MAX_REQUESTS_PER_IP'),
  },

  // Main system prompts
  systemPrompts: {
    INITIAL_SYSTEM_PROMPT: extractExport('INITIAL_SYSTEM_PROMPT'),
    FOLLOW_UP_SYSTEM_PROMPT: extractExport('FOLLOW_UP_SYSTEM_PROMPT'),
    PROMPT_FOR_IMAGE_GENERATION: extractExport('PROMPT_FOR_IMAGE_GENERATION'),
    PROMPT_FOR_PROJECT_NAME: extractExport('PROMPT_FOR_PROJECT_NAME'),
  },

  // Example prompts
  examples: extractArrayExport('PROMPTS_FOR_AI'),
};

// Save as JSON
const jsonOutput = JSON.stringify(prompts, null, 2);
writeFileSync('deepsite-prompts.json', jsonOutput);
console.log('✅ Saved to deepsite-prompts.json');

// Create markdown documentation
const markdownOutput = `# DeepSite Prompt Templates

Extracted from DeepSite v3 - Ready to use in your own projects!

## System Prompts

### Initial Generation Prompt

Use this when generating a brand new website from scratch.

\`\`\`
${prompts.systemPrompts.INITIAL_SYSTEM_PROMPT}
\`\`\`

### Follow-Up Edit Prompt

Use this when modifying existing HTML code.

\`\`\`
${prompts.systemPrompts.FOLLOW_UP_SYSTEM_PROMPT}
\`\`\`

### Image Generation Guidance

\`\`\`
${prompts.systemPrompts.PROMPT_FOR_IMAGE_GENERATION}
\`\`\`

### Project Naming Instruction

\`\`\`
${prompts.systemPrompts.PROMPT_FOR_PROJECT_NAME}
\`\`\`

## Formatting Tags

DeepSite uses special tags to structure AI output for parsing:

| Tag | Value | Purpose |
|-----|-------|---------|
| SEARCH_START | \`${prompts.tags.SEARCH_START}\` | Marks start of code to search for |
| DIVIDER | \`${prompts.tags.DIVIDER}\` | Separates search block from replacement |
| REPLACE_END | \`${prompts.tags.REPLACE_END}\` | Marks end of replacement block |
| NEW_PAGE_START | \`${prompts.tags.NEW_PAGE_START}\` | Marks start of new page |
| NEW_PAGE_END | \`${prompts.tags.NEW_PAGE_END}\` | Marks end of new page |
| UPDATE_PAGE_START | \`${prompts.tags.UPDATE_PAGE_START}\` | Marks start of page update |
| UPDATE_PAGE_END | \`${prompts.tags.UPDATE_PAGE_END}\` | Marks end of page update |
| PROJECT_NAME_START | \`${prompts.tags.PROJECT_NAME_START}\` | Marks start of project name |
| PROJECT_NAME_END | \`${prompts.tags.PROJECT_NAME_END}\` | Marks end of project name |

## Example Prompts

These are example prompts that work well with DeepSite's system:

${prompts.examples.map((example, i) => `${i + 1}. ${example}`).join('\n')}

## Usage Examples

### With Anthropic (Claude)

\`\`\`javascript
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const prompts = JSON.parse(readFileSync("deepsite-prompts.json"));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateWebsite(userPrompt) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system: prompts.systemPrompts.INITIAL_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  return message.content[0].text;
}

const html = await generateWebsite("Create a landing page for a coffee shop");
console.log(html);
\`\`\`

### With OpenAI

\`\`\`javascript
import OpenAI from "openai";
import { readFileSync } from "fs";

const prompts = JSON.parse(readFileSync("deepsite-prompts.json"));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateWebsite(userPrompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: prompts.systemPrompts.INITIAL_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  return completion.choices[0].message.content;
}

const html = await generateWebsite("Create a portfolio for a photographer");
console.log(html);
\`\`\`

### With Ollama (Local)

\`\`\`javascript
import { readFileSync } from "fs";

const prompts = JSON.parse(readFileSync("deepsite-prompts.json"));

async function generateWebsite(userPrompt) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-coder:33b",
      messages: [
        { role: "system", content: prompts.systemPrompts.INITIAL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    }),
  });

  const data = await response.json();
  return data.message.content;
}

const html = await generateWebsite("Create a todo list app");
console.log(html);
\`\`\`

## Parsing AI Output

When using the FOLLOW_UP_SYSTEM_PROMPT, the AI will return SEARCH/REPLACE blocks:

\`\`\`
${prompts.tags.SEARCH_START}
<old code here>
${prompts.tags.DIVIDER}
<new code here>
${prompts.tags.REPLACE_END}
\`\`\`

Parse this format to apply code changes:

\`\`\`javascript
function parseUpdates(aiResponse) {
  const updates = [];
  const regex = new RegExp(
    \`\${prompts.tags.SEARCH_START}([\\\\s\\\\S]*?)\${prompts.tags.DIVIDER}([\\\\s\\\\S]*?)\${prompts.tags.REPLACE_END}\`,
    'g'
  );

  let match;
  while ((match = regex.exec(aiResponse)) !== null) {
    updates.push({
      search: match[1].trim(),
      replace: match[2].trim(),
    });
  }

  return updates;
}

// Apply updates to HTML
function applyUpdates(html, updates) {
  let updatedHtml = html;
  for (const { search, replace } of updates) {
    updatedHtml = updatedHtml.replace(search, replace);
  }
  return updatedHtml;
}
\`\`\`

## Configuration

- **MAX_REQUESTS_PER_IP**: ${prompts.config.MAX_REQUESTS_PER_IP} (rate limit for unauthenticated users)

## License

These prompts are extracted from DeepSite v3 (MIT License).
Use them freely in your own projects!

## Resources

- **DeepSite**: https://huggingface.co/spaces/AnkhLP--deepsite
- **Anthropic API**: https://docs.anthropic.com
- **OpenAI API**: https://platform.openai.com/docs
- **Ollama**: https://ollama.com

---

Generated with \`extract-prompts.js\`
`;

writeFileSync('deepsite-prompts.md', markdownOutput);
console.log('✅ Saved to deepsite-prompts.md');

console.log('\n📦 Extraction Complete!');
console.log('\nFiles created:');
console.log('  - deepsite-prompts.json (structured data)');
console.log('  - deepsite-prompts.md (documentation)');
console.log('\nUse these prompts in:');
console.log('  - Claude Desktop (via MCP)');
console.log('  - Standalone scripts');
console.log('  - Your own AI applications');
console.log('\nSee INTEGRATION_EXAMPLES.md for usage examples.');
