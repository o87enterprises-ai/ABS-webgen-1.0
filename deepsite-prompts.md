# DeepSite Prompt Templates

Extracted from DeepSite v3 - Ready to use in your own projects!

## System Prompts

### Initial Generation Prompt

Use this when generating a brand new website from scratch.

```
null
```

### Follow-Up Edit Prompt

Use this when modifying existing HTML code.

```
null
```

### Image Generation Guidance

```
null
```

### Project Naming Instruction

```
null
```

## Formatting Tags

DeepSite uses special tags to structure AI output for parsing:

| Tag | Value | Purpose |
|-----|-------|---------|
| SEARCH_START | `<<<<<<< SEARCH` | Marks start of code to search for |
| DIVIDER | `=======` | Separates search block from replacement |
| REPLACE_END | `>>>>>>> REPLACE` | Marks end of replacement block |
| NEW_PAGE_START | `<<<<<<< NEW_PAGE_START ` | Marks start of new page |
| NEW_PAGE_END | ` >>>>>>> NEW_PAGE_END` | Marks end of new page |
| UPDATE_PAGE_START | `<<<<<<< UPDATE_PAGE_START ` | Marks start of page update |
| UPDATE_PAGE_END | ` >>>>>>> UPDATE_PAGE_END` | Marks end of page update |
| PROJECT_NAME_START | `<<<<<<< PROJECT_NAME_START ` | Marks start of project name |
| PROJECT_NAME_END | ` >>>>>>> PROJECT_NAME_END` | Marks end of project name |

## Example Prompts

These are example prompts that work well with DeepSite's system:

1. Create a landing page for a SaaS product, with a hero section, a features section, a pricing section, and a call to action section.
2. Create a portfolio website for a designer, with a hero section, a projects section, a about section, and a contact section.
3. Create a blog website for a writer, with a hero section, a blog section, a about section, and a contact section.
4. Create a Tic Tac Toe game, with a game board, a history section, and a score section.
5. Create a Weather App, with a search bar, a weather section, and a forecast section.
6. Create a Calculator, with a calculator section, and a history section.
7. Create a Todo List, with a todo list section, and a history section.
8. Create a Calendar, with a calendar section, and a history section.
9. Create a Music Player, with a music player section, and a history section.
10. Create a Quiz App, with a quiz section, and a history section.
11. Create a Pomodoro Timer, with a timer section, and a history section.
12. Create a Notes App, with a notes section, and a history section.
13. Create a Task Manager, with a task list section, and a history section.
14. Create a Password Generator, with a password generator section, and a history section.
15. Create a Currency Converter, with a currency converter section, and a history section.
16. Create a Dictionary, with a dictionary section, and a history section.

## Usage Examples

### With Anthropic (Claude)

```javascript
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
```

### With OpenAI

```javascript
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
```

### With Ollama (Local)

```javascript
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
```

## Parsing AI Output

When using the FOLLOW_UP_SYSTEM_PROMPT, the AI will return SEARCH/REPLACE blocks:

```
<<<<<<< SEARCH
<old code here>
=======
<new code here>
>>>>>>> REPLACE
```

Parse this format to apply code changes:

```javascript
function parseUpdates(aiResponse) {
  const updates = [];
  const regex = new RegExp(
    `${prompts.tags.SEARCH_START}([\\s\\S]*?)${prompts.tags.DIVIDER}([\\s\\S]*?)${prompts.tags.REPLACE_END}`,
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
```

## Configuration

- **MAX_REQUESTS_PER_IP**: 4 (rate limit for unauthenticated users)

## License

These prompts are extracted from DeepSite v3 (MIT License).
Use them freely in your own projects!

## Resources

- **DeepSite**: https://huggingface.co/spaces/AnkhLP--deepsite
- **Anthropic API**: https://docs.anthropic.com
- **OpenAI API**: https://platform.openai.com/docs
- **Ollama**: https://ollama.com

---

Generated with `extract-prompts.js`
