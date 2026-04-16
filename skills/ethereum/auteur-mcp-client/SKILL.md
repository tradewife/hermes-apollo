---
name: auteur-mcp-client
description: Call the AUTEUR MCP server programmatically with x402 payment. Covers EIP-712 signing, Streamable HTTP SSE parsing, session management, and the correct tool workflow.
version: 1.0.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [auteur, mcp, x402, video-generation, cinematography]
prerequisites:
  commands: []
---

# AUTEUR MCP Client

Programmatic access to the AUTEUR MCP server at `https://auteur-mcp-production.up.railway.app/mcp`.

## Critical: EIP-712 Signing (Not personal_sign)

The x402 payment verification tries EIP-712 first, then falls back to personal_sign. However, `personal_sign` produces a **signer mismatch** even with the correct key. You MUST sign using EIP-712 typed data via `eth_account.messages.encode_typed_data`.

The deployer wallet private key is stored in `~/0xAUTEUR/.env`. Load it via `python-dotenv` and construct an EIP-712 Payment proof with:
- Domain: name="AUTEUR Payment", version="1", chainId=84532 (Base Sepolia), verifyingContract=`0xBAc0d61DE2B52Dbb7C6800210bf8A54388032109`
- Types: Payment(amount uint256, asset string, recipient address, nonce uint256, expiry uint256)
- Amount: 100000000000000 (0.0001 ETH)
- Nonce: use millisecond-resolution timestamp (`int(time.time() * 1000)`) to avoid collisions
- Expiry: current time + 3600

Sign with `Account.from_key(key).sign_message(encode_typed_data(full_message=typed_data))`, then base64-encode the proof JSON.

**Do NOT use `cast wallet sign` from Foundry** — it produces personal_sign format which causes signer mismatch.

## Streamable HTTP Protocol

The MCP server uses Streamable HTTP, NOT raw JSON-RPC. Responses are SSE-formatted.

### Required headers

```
Content-Type: application/json
Accept: application/json, text/event-stream    ← MANDATORY
X-Payment: <base64 proof>
mcp-session-id: <from init response>           ← after first call
```

Without `Accept: application/json, text/event-stream`, you get HTTP 406 "Not Acceptable".

### Session flow

1. POST `initialize` → extract `mcp-session-id` from response header
2. POST `notifications/initialized` (with session header, fresh nonce)
3. POST `tools/call` (with session header, fresh nonce per call)

Each call needs a fresh payment proof with a new nonce.

### SSE response parsing

Responses are `text/event-stream` format:
```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{...}}

```

Parse by splitting on `\n`, collecting `data:` lines, joining on blank-line boundaries.

### httpx pattern (recommended)

Use `httpx` Python client instead of `curl` for reliable SSE handling:

```python
import httpx

def parse_sse(text):
    results, current_data = [], ""
    for line in text.split("\n"):
        line = line.strip()
        if line.startswith("data: "):
            current_data = line[6:]
        elif line == "" and current_data:
            try: results.append(json.loads(current_data))
            except json.JSONDecodeError: pass
            current_data = ""
    if current_data:
        try: results.append(json.loads(current_data))
        except json.JSONDecodeError: pass
    return results
```

## Tool Workflow

### Quick compose (standalone, no project)
- `quick_compose(description, style_description, mood, model)` → optimized prompt, NO generation

### Project-based
- `analyse_brief` → project_id
- `propose_visual_language` → lock style (call ONCE, never per-shot)
- `plan_shots` → adds shots to project (scene_description + pacing)
- `generate_video` → validates + generates, returns video_url
- `sanitise_and_submit` → validates only, returns prompt (NO generation)
- `refine_shot` → modifies existing shot (no meisner_note or tension_level support)

### Key distinction
- `sanitise_and_submit` = validation only, returns prompt
- `generate_video` = validation + generation, returns video_url
- `quick_compose` = standalone prompt composition, no project needed

## Direct KIE API (bypass AUTEUR entirely)

When you need to call KIE.ai directly without going through AUTEUR's MCP server or Python pipeline.

### Correct endpoints

**NOT** `/v1/video/generate` — that's a 404. The actual endpoints are:

- **Submit**: `POST https://api.kie.ai/api/v1/jobs/createTask`
- **Poll**: `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...`

### Kling 3.0 payload format

The model identifier is `kling-3.0/video` (not `kling-3.0`). Input is nested:

```
model: "kling-3.0/video"
input.prompt: string
input.sound: boolean
input.duration: string (seconds, no "s" suffix)
input.aspect_ratio: "16:9"
input.mode: "pro"
input.multi_shots: false
input.multi_prompt: []
```

### Response formats

**Submit** returns `{code: 200, data: {taskId: "..."}}`.

**Poll** returns `{code: 200, data: {state: "...", resultJson: "...", failMsg: "..."}}`.

State values are lowercase: `waiting`, `processing`, `success`, `fail`.

When `state == "success"`, parse `resultJson` as JSON and extract `resultUrls[0]` for the video URL.

### Polling cadence

Video generation takes 60-180s per clip. Poll every 15s. Timeout after 600s.

### Authentication

KIE_API_KEY is in `~/AUTEUR/.env`. Auth via `Authorization: Bearer <key>`.

### Source of truth

The canonical implementation is in `~/AUTEUR/auteur/providers/kie.py` — read it if the API changes.

## FFmpeg Video Assembly Patterns

### Crossfade between two videos (timebase normalization required)

When crossfading videos from different sources, you MUST normalize fps first or `xfade` fails with timebase mismatch:

```
ffmpeg -i video1.mp4 -i video2.mp4 -i audio.mp3 \
  -filter_complex "\
    [0:v]trim=0:14,fps=24,setpts=PTS-STARTPTS[v0];\
    [1:v]fps=24,setpts=PTS-STARTPTS[v1];\
    [v0][v1]xfade=transition=fade:duration=1:offset=13[outv];\
    [2:a]atrim=0:118,asetpts=PTS-STARTPTS[outa]" \
  -map "[outv]" -map "[outa]" -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 192k -r 24 output.mp4
```

Key points:
- `fps=24` on BOTH inputs normalizes timebases
- `offset = first_clip_duration - crossfade_duration` (e.g., 14 - 1 = 13)
- Use `-r 24` on output to lock framerate
- `crf 18` for quality, `slow` preset for compression

### Concatenate with audio overlay

```
ffmpeg -i video.mp4 -i audio.mp3 -t 30 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k output.mp4
```

### Extract audio from video

```
ffmpeg -i video.mp4 -vn -acodec libmp3lame -q:a 2 audio.mp3
```

## Local Generation (bypass MCP)

If MCP is unavailable, generate directly via KieProvider:

```python
import asyncio, sys
sys.path.insert(0, "/home/kt/AUTEUR")
from auteur.providers.kie import KieProvider
from auteur.providers.base import GenerationRequest, GenerationType
from auteur.prompt.optimizer import PromptOptimizer

provider = KieProvider()
optimized = PromptOptimizer.optimize(prompt, neg, model="kling-3.0", aspect_ratio="16:9", duration_s=15.0)
request = GenerationRequest(prompt=optimized, generation_type=GenerationType.VIDEO)
result = asyncio.run(provider.generate(request))  # MUST use asyncio.run()
```

**IMPORTANT**: `KieProvider.generate()` is async — direct call returns coroutine, not result.

## Pitfalls

- Foundry `cast wallet sign` → personal_sign format → signer mismatch. Always use Python `eth_account` EIP-712.
- Nonces are in-memory on server. Use millisecond-resolution timestamps.
- `curl` may not capture SSE correctly → use `httpx`.
- `Accept` header mandatory for Streamable HTTP.
- Missing session ID → "Bad Request: Missing session ID".
- `generate_video` requires shots on project — won't create from description args.
- `sanitise_and_submit` takes only `(project_id, scene_index, shot_index, model)`.
- `refine_shot` doesn't support `meisner_note` or `tension_level`.
- Cloudflare Turnstile blocks headless Basescan access.
- Remotion `OffthreadVideo` with large files can timeout in headless — use `--gl=angle --concurrency=1`.
