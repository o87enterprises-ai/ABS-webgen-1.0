/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { generateWithLLM } from "@/lib/llm-router";

import { MODELS } from "@/lib/providers";
import {
  DIVIDER,
  FOLLOW_UP_SYSTEM_PROMPT,
  INITIAL_SYSTEM_PROMPT,
  MAX_REQUESTS_PER_IP,
  NEW_PAGE_END,
  NEW_PAGE_START,
  REPLACE_END,
  SEARCH_START,
  UPDATE_PAGE_START,
  UPDATE_PAGE_END,
  PROMPT_FOR_PROJECT_NAME,
} from "@/lib/prompts";
import MY_TOKEN_KEY from "@/lib/get-cookie-name";
import { Page } from "@/types";
import { createRepo, RepoDesignation, uploadFiles } from "@huggingface/hub";
import { isAuthenticated } from "@/lib/auth";
import { COLORS } from "@/lib/utils";
import { templates } from "@/lib/templates";

const ipAddresses = new Map();

export async function POST(request: NextRequest) {
  const authHeaders = await headers();
  const userToken = request.cookies.get(MY_TOKEN_KEY())?.value;

  const body = await request.json();
  const { prompt, provider, model, redesignMarkdown, enhancedSettings, pages, images } = body;

  if (!model || (!prompt && !redesignMarkdown)) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate that custom LLM API is configured
  if (!process.env.CUSTOM_LLM_BASE_URL) {
    return NextResponse.json(
      { ok: false, error: "Custom LLM API is not configured" },
      { status: 500 }
    );
  }

  let rewrittenPrompt = "";

  // Add uploaded images FIRST and with strong emphasis
  if (images && Array.isArray(images) && images.length > 0) {
    rewrittenPrompt = `## CRITICAL: USER-PROVIDED IMAGES - YOU MUST USE THESE

I am providing ${images.length} image(s) that MUST be included in the design. This is NOT optional.

${images.map((img: { name: string; url: string }, i: number) => {
  const isLogo = img.name.toLowerCase().includes('logo');
  const placement = isLogo
    ? 'Place this logo in the HEADER/NAVBAR of every page, and optionally in the footer.'
    : 'Use this image prominently in the design where appropriate.';

  return `### IMAGE ${i + 1}: "${img.name}"
${placement}
USE THIS EXACT SRC: src="${img.url}"`;
}).join('\n\n')}

**MANDATORY REQUIREMENTS:**
1. You MUST use <img> tags with the EXACT src paths provided above (e.g., src="/uploads/...")
2. Do NOT use placeholder images like picsum.photos or unsplash - use ONLY the paths I provided
3. If an image is named "logo" or similar, it MUST appear in the header/navbar
4. Use the paths exactly as given - they will work in the generated HTML

---

## USER REQUEST:
`;
  }

  // Add the main prompt
  rewrittenPrompt += redesignMarkdown
    ? `Here is my current design as a markdown:\n\n${redesignMarkdown}\n\nNow, please create a new design based on this markdown. Use the images in the markdown.`
    : prompt;

  if (enhancedSettings?.isActive) {
    // rewrittenPrompt = await rewritePrompt(rewrittenPrompt, enhancedSettings, { token, billTo }, selectedModel.value, selectedProvider.provider);
  }

  // Track if client has disconnected
  let isAborted = false;
  request.signal.addEventListener('abort', () => {
    isAborted = true;
  });

  try {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const response = new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    (async () => {
      try {
        const systemPrompt = INITIAL_SYSTEM_PROMPT;

        const userPrompt = rewrittenPrompt + (enhancedSettings.isActive ? `

1. I want to use the following primary color: ${enhancedSettings.primaryColor} (eg: bg-${enhancedSettings.primaryColor}-500).
2. I want to use the following secondary color: ${enhancedSettings.secondaryColor} (eg: bg-${enhancedSettings.secondaryColor}-500).
3. I want to use the following theme: ${enhancedSettings.theme} mode.` : "");

        // Check if client disconnected before making LLM call
        if (isAborted) {
          console.log('Client disconnected before LLM call');
          return;
        }

        // Get response from custom LLM API (non-streaming)
        // DeepSeek V3 via Ollama - use higher token limit for quality HTML generation
        const llmResponse = await generateWithLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          maxTokens: 8192,  // Higher limit for complete HTML pages
          temperature: 0.6,  // Lower for more consistent code
          topP: 0.95,
          frequencyPenalty: 0.1,  // Reduce repetition
        });

        // Check if client disconnected after LLM call
        if (isAborted) {
          console.log('Client disconnected after LLM call');
          return;
        }

        // Simulate streaming by sending the response in chunks
        const content = llmResponse.content;
        const chunkSize = 100; // Larger chunks for fewer writes

        for (let i = 0; i < content.length; i += chunkSize) {
          // Stop writing if client disconnected
          if (isAborted) {
            console.log('Client disconnected during streaming');
            break;
          }
          const chunk = content.slice(i, i + chunkSize);
          await writer.write(encoder.encode(chunk));
        }

        // Only close if not aborted
        if (!isAborted) {
          await writer.close();
        }
      } catch (error: any) {
        // Only write error if client is still connected
        if (!isAborted) {
          try {
            await writer.write(
              encoder.encode(
                JSON.stringify({
                  ok: false,
                  message:
                    error.message ||
                    "An error occurred while processing your request.",
                })
              )
            );
          } catch {
            // Ignore write errors if connection is closed
          }
        }
      } finally {
        // Ensure the writer is always closed, even if already closed
        try {
          await writer?.close();
        } catch {
          // Ignore errors when closing the writer as it might already be closed
        }
      }
    })();

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log("PUT request received");
  // Authentication check removed - allow all users to make edits
  const user = await isAuthenticated();
  // Note: user may be null for unauthenticated users

  const authHeaders = await headers();

  const body = await request.json();
  const { prompt, previousPrompts, provider, selectedElementHtml, model, pages, files, repoId: repoIdFromBody, isNew, enhancedSettings } =
    body;

  let repoId = repoIdFromBody;

  if (!prompt || pages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const selectedModel = MODELS.find(
    (m) => m.value === model || m.label === model
  );
  if (!selectedModel) {
    return NextResponse.json(
      { ok: false, error: "Invalid model selected" },
      { status: 400 }
    );
  }

  // Validate that custom LLM API is configured
  if (!process.env.CUSTOM_LLM_BASE_URL) {
    return NextResponse.json(
      { ok: false, error: "Custom LLM API is not configured" },
      { status: 500 }
    );
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const createFlexibleHtmlRegex = (searchBlock: string) => {
    let searchRegex = escapeRegExp(searchBlock)
      .replace(/\s+/g, '\\s*')
      .replace(/>\s*</g, '>\\s*<')
      .replace(/\s*>/g, '\\s*>');
    
    return new RegExp(searchRegex, 'g');
  };

  try {
    const systemPrompt = FOLLOW_UP_SYSTEM_PROMPT + (isNew ? PROMPT_FOR_PROJECT_NAME : "");
    const userContext = "You are modifying the HTML file based on the user's request.";

    // Send all pages without filtering
    const allPages = pages || [];
    const pagesContext = allPages
      .map((p: Page) => `- ${p.path}\n${p.html}`)
      .join("\n\n");

    const assistantContext = `${
      selectedElementHtml
        ? `\n\nYou have to update ONLY the following element, NOTHING ELSE: \n\n\`\`\`html\n${selectedElementHtml}\n\`\`\` Could be in multiple pages, if so, update all the pages.`
        : ""
    }. Current pages (${allPages.length} total): ${pagesContext}. ${files?.length > 0 ? `Available images: ${files?.map((f: string) => f).join(', ')}.` : ""}`;

    // Use custom LLM API (non-streaming)
    // DeepSeek V3 via Ollama - use higher token limit for quality updates
    const llmResponse = await generateWithLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userContext,
        },
        {
          role: "assistant",
          content: assistantContext,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 8192,  // Higher limit for complete HTML updates
      temperature: 0.6,  // Lower for more consistent code
      topP: 0.95,
      frequencyPenalty: 0.1,  // Reduce repetition
    });

    const chunk = llmResponse.content;
    if (!chunk) {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }

    if (chunk) {
      const updatedLines: number[][] = [];
      let newHtml = "";
      const updatedPages = [...(pages || [])];

      const updatePageRegex = new RegExp(`${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\s]+)\\s*${UPDATE_PAGE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|$)`, 'g');
      let updatePageMatch;
      
      while ((updatePageMatch = updatePageRegex.exec(chunk)) !== null) {
        const [, pagePath, pageContent] = updatePageMatch;
        
        const pageIndex = updatedPages.findIndex(p => p.path === pagePath);
        if (pageIndex !== -1) {
          let pageHtml = updatedPages[pageIndex].html;
          
          let processedContent = pageContent;
          const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
          if (htmlMatch) {
            processedContent = htmlMatch[1];
          }
          let position = 0;
          let moreBlocks = true;

          while (moreBlocks) {
            const searchStartIndex = processedContent.indexOf(SEARCH_START, position);
            if (searchStartIndex === -1) {
              moreBlocks = false;
              continue;
            }

            const dividerIndex = processedContent.indexOf(DIVIDER, searchStartIndex);
            if (dividerIndex === -1) {
              moreBlocks = false;
              continue;
            }

            const replaceEndIndex = processedContent.indexOf(REPLACE_END, dividerIndex);
            if (replaceEndIndex === -1) {
              moreBlocks = false;
              continue;
            }

            const searchBlock = processedContent.substring(
              searchStartIndex + SEARCH_START.length,
              dividerIndex
            );
            const replaceBlock = processedContent.substring(
              dividerIndex + DIVIDER.length,
              replaceEndIndex
            );

            if (searchBlock.trim() === "") {
              pageHtml = `${replaceBlock}\n${pageHtml}`;
              updatedLines.push([1, replaceBlock.split("\n").length]);
            } else {
              const regex = createFlexibleHtmlRegex(searchBlock);
              const match = regex.exec(pageHtml);
              
              if (match) {
                const matchedText = match[0];
                const beforeText = pageHtml.substring(0, match.index);
                const startLineNumber = beforeText.split("\n").length;
                const replaceLines = replaceBlock.split("\n").length;
                const endLineNumber = startLineNumber + replaceLines - 1;

                updatedLines.push([startLineNumber, endLineNumber]);
                pageHtml = pageHtml.replace(matchedText, replaceBlock);
              }
            }

            position = replaceEndIndex + REPLACE_END.length;
          }

          updatedPages[pageIndex].html = pageHtml;
          
          if (pagePath === '/' || pagePath === '/index' || pagePath === 'index') {
            newHtml = pageHtml;
          }
        }
      }

      const newPageRegex = new RegExp(`${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\s]+)\\s*${NEW_PAGE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=${UPDATE_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${NEW_PAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|$)`, 'g');
      let newPageMatch;
      
      while ((newPageMatch = newPageRegex.exec(chunk)) !== null) {
        const [, pagePath, pageContent] = newPageMatch;
        
        let pageHtml = pageContent;
        const htmlMatch = pageContent.match(/```html\s*([\s\S]*?)\s*```/);
        if (htmlMatch) {
          pageHtml = htmlMatch[1];
        }
        
        const existingPageIndex = updatedPages.findIndex(p => p.path === pagePath);
        
        if (existingPageIndex !== -1) {
          updatedPages[existingPageIndex] = {
            path: pagePath,
            html: pageHtml.trim()
          };
        } else {
          updatedPages.push({
            path: pagePath,
            html: pageHtml.trim()
          });
        }
      }

      if (updatedPages.length === pages?.length && !chunk.includes(UPDATE_PAGE_START)) {
        let position = 0;
        let moreBlocks = true;

        while (moreBlocks) {
          const searchStartIndex = chunk.indexOf(SEARCH_START, position);
          if (searchStartIndex === -1) {
            moreBlocks = false;
            continue;
          }

          const dividerIndex = chunk.indexOf(DIVIDER, searchStartIndex);
          if (dividerIndex === -1) {
            moreBlocks = false;
            continue;
          }

          const replaceEndIndex = chunk.indexOf(REPLACE_END, dividerIndex);
          if (replaceEndIndex === -1) {
            moreBlocks = false;
            continue;
          }

          const searchBlock = chunk.substring(
            searchStartIndex + SEARCH_START.length,
            dividerIndex
          );
          const replaceBlock = chunk.substring(
            dividerIndex + DIVIDER.length,
            replaceEndIndex
          );

          if (searchBlock.trim() === "") {
            newHtml = `${replaceBlock}\n${newHtml}`;
            updatedLines.push([1, replaceBlock.split("\n").length]);
          } else {
            const regex = createFlexibleHtmlRegex(searchBlock);
            const match = regex.exec(newHtml);
            
            if (match) {
              const matchedText = match[0];
              const beforeText = newHtml.substring(0, match.index);
              const startLineNumber = beforeText.split("\n").length;
              const replaceLines = replaceBlock.split("\n").length;
              const endLineNumber = startLineNumber + replaceLines - 1;

              updatedLines.push([startLineNumber, endLineNumber]);
              newHtml = newHtml.replace(matchedText, replaceBlock);
            }
          }

          position = replaceEndIndex + REPLACE_END.length;
        }

        // Update the main HTML if it's the index page
        const mainPageIndex = updatedPages.findIndex(p => p.path === '/' || p.path === '/index' || p.path === 'index');
        if (mainPageIndex !== -1) {
          updatedPages[mainPageIndex].html = newHtml;
        }
      }

      // If user is not authenticated, just return the updated pages without saving to HuggingFace
      if (!user || user instanceof NextResponse) {
        return NextResponse.json({
          ok: true,
          updatedLines,
          pages: updatedPages,
          repoId: null,
          commit: {
            title: prompt,
            date: new Date().toISOString(),
          }
        });
      }

      const files: File[] = [];
      updatedPages.forEach((page: Page) => {
        const file = new File([page.html], page.path, { type: "text/html" });
        files.push(file);
      });

      if (isNew) {
        const projectName = chunk.match(/<<<<<<< PROJECT_NAME_START ([\s\S]*?) >>>>>>> PROJECT_NAME_END/)?.[1]?.trim();
        const formattedTitle = projectName?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .split("-")
          .filter(Boolean)
          .join("-")
          .slice(0, 96);
        const repo: RepoDesignation = {
          type: "space",
          name: `${user.name}/${formattedTitle}`,
        };
        const { repoUrl} = await createRepo({
          repo,
          accessToken: user.token as string,
        });
        repoId = repoUrl.split("/").slice(-2).join("/");
        const colorFrom = COLORS[Math.floor(Math.random() * COLORS.length)];
        const colorTo = COLORS[Math.floor(Math.random() * COLORS.length)];
        const README = `---
title: ${projectName}
colorFrom: ${colorFrom}
colorTo: ${colorTo}
emoji: 🐳
sdk: static
pinned: false
tags:
  - deepsite-v3
---

# Welcome to your new DeepSite project!
This project was created with [DeepSite](https://deepsite.hf.co).
      `;
        files.push(new File([README], "README.md", { type: "text/markdown" }));
      }

      const response = await uploadFiles({
        repo: {
          type: "space",
          name: repoId,
        },
        files,
        commitTitle: prompt,
        accessToken: user.token as string,
      });

      return NextResponse.json({
        ok: true,
        updatedLines,
        pages: updatedPages,
        repoId,
        commit: {
          ...response.commit,
          title: prompt,
        }
      });
    } else {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}

