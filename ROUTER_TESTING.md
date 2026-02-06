# Smart LLM Router - Testing Guide

## Implementation Summary

The multi-tier LLM router has been successfully implemented with automatic fallback support.

### Files Modified

1. **Created: `lib/llm-router.ts`** - Main router implementation
   - Tier 1: Your HuggingFace Space (Primary)
   - Tier 2: HF Serverless Inference (Fallback)
   - Automatic timeout handling per tier
   - Error logging and fallback cascade

2. **Updated: `.env.local`** - Added tier configuration
   - `TIER1_TIMEOUT=90000` (90 seconds for slow CPU space)
   - `TIER2_MODEL=deepseek-ai/deepseek-coder-1.3b-instruct`
   - `TIER2_TIMEOUT=60000` (60 seconds for GPU inference)
   - `TIER2_ENABLED=true`

3. **Updated: `app/api/ask/route.ts`** - Changed import (line 5)
   - From: `import { generateWithLLM } from "@/lib/llm-client"`
   - To: `import { generateWithLLM } from "@/lib/llm-router"`

### Architecture

```
┌─────────────────────────────────────┐
│   app/api/ask/route.ts              │
│   (Only import changed)             │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   lib/llm-router.ts                 │
│   Smart Router with Fallback        │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
┌─────────┐   ┌──────────┐
│ Tier 1  │   │  Tier 2  │
│ Primary │   │ Fallback │
└─────────┘   └──────────┘
```

## Testing Instructions

### 1. Test Tier 1 Success (Normal Operation)

**Expected Behavior:** Router uses Tier 1 (your HF Space) and succeeds.

**Steps:**
1. Start the development server: `npm run dev`
2. Open the app in browser: `http://localhost:3000`
3. Create a simple website request (e.g., "Create a landing page for a coffee shop")
4. Check browser console for logs

**Expected Logs:**
```
→ Trying: Tier 1: Your HF Space
✓ Success: Tier 1: Your HF Space (45000ms, total: 45000ms)
```

### 2. Test Tier 1 Timeout & Fallback to Tier 2

**Expected Behavior:** Tier 1 times out, router automatically falls back to Tier 2.

**Steps:**
1. Edit `.env.local` and set: `TIER1_TIMEOUT=5000` (5 seconds)
2. Restart the dev server
3. Make a website generation request
4. Tier 1 will timeout (your Space takes 30-60s)
5. Router will automatically try Tier 2

**Expected Logs:**
```
→ Trying: Tier 1: Your HF Space
✗ Failed: Tier 1: Your HF Space (5000ms) - Timeout after 5000ms
→ Trying: Tier 2: HF Serverless
✓ Success: Tier 2: HF Serverless (15000ms, total: 20000ms)
```

**After Testing:** Restore `TIER1_TIMEOUT=90000` in `.env.local`

### 3. Test Tier 1 Disabled (Force Tier 2)

**Expected Behavior:** Router skips Tier 1 and uses Tier 2 immediately.

**Steps:**
1. Edit `.env.local` and set: `CUSTOM_LLM_BASE_URL=https://invalid-url.example.com/v1`
2. Restart the dev server
3. Make a website generation request
4. Tier 1 will fail immediately, Tier 2 will be used

**Expected Logs:**
```
→ Trying: Tier 1: Your HF Space
✗ Failed: Tier 1: Your HF Space (500ms) - HTTP 404: Not Found
→ Trying: Tier 2: HF Serverless
✓ Success: Tier 2: HF Serverless (12000ms, total: 12500ms)
```

**After Testing:** Restore original `CUSTOM_LLM_BASE_URL` in `.env.local`

### 4. Test Both Tiers Fail (Error Handling)

**Expected Behavior:** Meaningful error message when all tiers fail.

**Steps:**
1. Edit `.env.local`:
   - Set: `CUSTOM_LLM_BASE_URL=https://invalid.example.com/v1`
   - Set: `TIER2_ENABLED=false`
2. Restart the dev server
3. Make a website generation request
4. Both tiers will fail

**Expected Logs:**
```
→ Trying: Tier 1: Your HF Space
✗ Failed: Tier 1: Your HF Space (500ms) - HTTP 404: Not Found
⊘ Skipped: Tier 2: HF Serverless (disabled)
Error: All LLM tiers failed. Tier 1: Your HF Space: HTTP 404: Not Found
```

**After Testing:** Restore original settings in `.env.local`

## Current Configuration

Based on your `.env.local`:

- **Tier 1 (Primary):** Your HuggingFace Space
  - URL: `https://truegleai-deepseek-coder-6b-api.hf.space/v1`
  - Model: `codellama-7b-instruct`
  - Timeout: 90 seconds
  - Status: ✓ Enabled

- **Tier 2 (Fallback):** HuggingFace Serverless
  - Model: `deepseek-ai/deepseek-coder-1.3b-instruct`
  - Token: Uses `HF_TOKEN` from env
  - Timeout: 60 seconds
  - Status: ✓ Enabled

## Monitoring Tier Usage

The router logs which tier responded for each request. Monitor these logs to:

1. **Track Tier 1 Performance:** If Tier 1 frequently times out, consider optimizing your Space
2. **Monitor Tier 2 Usage:** HF Serverless has rate limits (1000 requests/day on free tier)
3. **Identify Issues:** Patterns of failures can indicate configuration problems

## Success Criteria

- ✅ Router tries Tier 1 (Your HF Space) first
- ✅ Falls back to Tier 2 (HF Serverless) on Tier 1 failure/timeout
- ✅ Returns meaningful errors when both tiers fail
- ✅ No changes needed to existing API route logic (just import swap)
- ✅ Response times logged for monitoring
- ✅ Easy to configure via environment variables
- ✅ Maintains same interface as original `generateWithLLM`
- ✅ Can be extended to Tiers 3-4 in future without breaking changes

## Troubleshooting

### Router not falling back
- Check console logs for error messages
- Verify timeout values are reasonable
- Ensure `TIER2_ENABLED=true` in `.env.local`

### Tier 2 fails with 401 Unauthorized
- Check that `HF_TOKEN` is valid
- Token should start with `hf_`
- Regenerate token at https://huggingface.co/settings/tokens

### Both tiers fail
- Check network connectivity
- Verify all environment variables are set correctly
- Check HuggingFace status page for outages

### No logs appearing
- Ensure you're checking the **server console** (terminal), not browser console
- Logs appear in the terminal where you ran `npm run dev`

## Next Steps

After verifying the router works:

1. **Production Testing:** Make several real requests to verify tier usage
2. **Monitor Performance:** Track which tier is used most frequently
3. **Optimize Tier 1:** If needed, update your HF Space to DeepSeek-1.3B
4. **Cost Analysis:** Determine if commercial tier (Tier 4) is needed
5. **Rate Limit Monitoring:** Check if you're approaching Tier 2 rate limits

## Reverting Changes

If you need to revert to the old system:

1. Edit `app/api/ask/route.ts` line 5:
   - Change: `import { generateWithLLM } from "@/lib/llm-router"`
   - Back to: `import { generateWithLLM } from "@/lib/llm-client"`

2. Restart the server

The old `llm-client.ts` remains unchanged and functional.
