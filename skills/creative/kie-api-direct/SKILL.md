---
name: kie-api-direct
description: Direct API calls to KIE (kie.ai) for video and image generation with correct endpoint structure and response handling
tags: [video-generation, kie, api, kling, cinematography]
---

# KIE API Direct Usage

Call kie.ai's REST API directly for video generation (Kling, Veo, Runway, etc.) and image generation (Nano Banana, Flux, etc.).

## When to use

- AUTEUR MCP server has x402 payment enabled and you need to bypass it
- Direct control over KIE API parameters
- Debugging AUTEUR generation issues
- Batch generation workflows

## Prerequisites

```bash
# KIE_API_KEY required
export KIE_API_KEY="your-key-here"
```

## API Structure

Base URL: `https://api.kie.ai/api/v1`

### Video Models
- `kling-3.0/video` - Kling 3.0 (pro mode)
- `veo3`, `veo3.1` - Google Veo
- `runway_aleph`, `runway_gen4_turbo` - Runway
- `seedance1.5_pro` - ByteDance Seedance
- `wan2.6` - Alibaba Wan

### Image Models  
- `nano-banana-2` - Nano Banana 2
- `nano-banana-pro` - Nano Banana Pro
- `gpt-image/1.5-text-to-image` - GPT Image
- `flux-kontext` - Flux Kontext

## Workflow

### 1. Submit Generation Task

**Endpoint**: `POST /jobs/createTask`

**Headers**:
```python
{
    "Authorization": f"Bearer {KIE_API_KEY}",
    "Content-Type": "application/json"
}
```

**Payload for Kling 3.0 Video**:
```python
{
    "model": "kling-3.0/video",
    "input": {
        "prompt": "Your cinematic prompt here",
        "sound": False,
        "duration": "5",  # seconds as string
        "aspect_ratio": "16:9",  # or "9:16", "1:1"
        "mode": "pro",  # or "standard"
        "multi_shots": False,
        "multi_prompt": []
    }
}
```

**Response Format**:
```python
{
    "code": 200,
    "data": {
        "taskId": "e536ac53e4a1b0e1..."
    }
}
```

**Error Handling**:
- Check `result.get("code") == 200`
- If not 200, error is in `result.get("msg")`
- Extract taskId from `result["data"]["taskId"]`

### 2. Poll for Completion

**Endpoint**: `GET /jobs/recordInfo?taskId={taskId}`

**Poll every 15 seconds for video, 5 seconds for images**

**Response Format**:
```python
{
    "code": 200,
    "data": {
        "state": "waiting",  # or "pending", "processing", "success", "fail"
        "resultJson": "{\"resultUrls\": [\"https://...\"]}"  # when state=="success"
    }
}
```

**State Values** (case-insensitive, VERIFIED 2026-03-23):
- `waiting`, `pending`, `processing`, `running` - still generating
- `success`, `completed` - done, extract URLs from resultJson
- `fail`, `failed` - error, check `failMsg` or `failCode`

**IMPORTANT**: States come back lowercase from KIE. Always use `.lower()` comparison.
Kling 3.0 observed states: `waiting` → `processing` → `success` (avg 90-150s per shot)

### 3. Download Result

When state is `success`:
```python
result_json = data.get("resultJson", "{}")
result_data = json.loads(result_json) if isinstance(result_json, str) else result_json
urls = result_data.get("resultUrls", [])
video_url = urls[0] if urls else None
```

Download with `requests.get(video_url, timeout=60)`

## Common Pitfalls

1. **Wrong endpoint**: It's `/api/v1/jobs/createTask` not `/v1/video/generate`
2. **Model name**: Use `kling-3.0/video` not just `kling-3.0`
3. **Duration format**: String not int: `"5"` not `5`
4. **State checking**: Lowercase comparison - `state.lower() in ["success", "completed"]`
5. **TaskId location**: In `result["data"]["taskId"]` not `result["taskId"]`
6. **Poll endpoint**: Query param `?taskId=xxx` not path param
7. **Timeout**: Video generation takes 60-180 seconds, set poll timeout to 600s

## Full Example

```python
import requests
import json
import time

KIE_API_KEY = "your-key"
BASE_URL = "https://api.kie.ai/api/v1"

# Submit
response = requests.post(
    f"{BASE_URL}/jobs/createTask",
    headers={
        "Authorization": f"Bearer {KIE_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "kling-3.0/video",
        "input": {
            "prompt": "Extreme close-up of hand writing on paper, cinematographic lighting",
            "sound": False,
            "duration": "4",
            "aspect_ratio": "16:9",
            "mode": "pro",
            "multi_shots": False,
            "multi_prompt": []
        }
    },
    timeout=300
)

result = response.json()
if result.get("code") != 200:
    raise Exception(f"API error: {result.get('msg')}")

task_id = result["data"]["taskId"]
print(f"Task submitted: {task_id}")

# Poll
while True:
    response = requests.get(
        f"{BASE_URL}/jobs/recordInfo",
        params={"taskId": task_id},
        headers={"Authorization": f"Bearer {KIE_API_KEY}"},
        timeout=30
    )
    
    result = response.json()
    if result.get("code") != 200:
        raise Exception(f"Poll error: {result.get('msg')}")
    
    data = result["data"]
    state = data.get("state", "").lower()
    
    print(f"State: {state}")
    
    if state in ["success", "completed"]:
        result_json = data.get("resultJson", "{}")
        result_data = json.loads(result_json) if isinstance(result_json, str) else result_json
        urls = result_data.get("resultUrls", [])
        video_url = urls[0]
        print(f"Complete: {video_url}")
        break
    elif state in ["fail", "failed"]:
        fail_msg = data.get("failMsg") or data.get("failCode")
        raise Exception(f"Generation failed: {fail_msg}")
    
    time.sleep(15)

# Download
video_response = requests.get(video_url, timeout=60)
with open("output.mp4", "wb") as f:
    f.write(video_response.content)
```

## Source Reference

Read `~/AUTEUR/auteur/providers/kie.py` for authoritative endpoint structure:
- `_submit_endpoint()` → `/jobs/createTask`
- `_status_endpoint()` → `/jobs/recordInfo`
- `_build_kling_video_input()` → payload structure

## Verification

Successful submission returns task ID immediately. Video generation typically takes:
- Kling 3.0: 90-180 seconds (VERIFIED: 4s shots took 2-3 minutes each)
- Veo 3: 60-120 seconds
- Image generation: 10-30 seconds

Always handle "waiting" and "processing" states - generation is not instant.

## Real-World Timing (2026-03-23 validation)

6-shot demo sequence (4-8 seconds each):
- Shot 1 (4s): 2.5 minutes
- Shot 2 (6s): 2 minutes  
- Shot 3 (8s): 3 minutes
- Shot 4 (4s): 2 minutes
- Shot 5 (4s): 3 minutes
- Shot 6 (4s): 2 minutes

**Total: ~15 minutes for 30 seconds of cinematic video**

Set poll timeout to 600s minimum. Use 15-second poll intervals to avoid hammering the API.
