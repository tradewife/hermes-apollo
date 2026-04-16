---
name: auteur-music-video
description: Create cinematic music videos using AUTEUR's cinematography intelligence. Generates shot-by-shot breakdowns with Auteur Layer DP enrichment, optimized prompts for AI video models (Kling, Veo, Runway), and concept art via Kie.ai.
category: creative
---

# AUTEUR Music Video Pipeline

Create professional music video treatments and generate AI video using AUTEUR's deep cinematography knowledge.

## When to Use
- Music video production with AI generation
- Cinematic shot planning and prompt optimization
- Any project needing professional DP-level visual direction

## Prerequisites
- AUTEUR installed at `/home/kt/AUTEUR` with venv
- Always run AUTEUR scripts with `/home/kt/AUTEUR/.venv/bin/python3` (system python may miss `pydantic` and other deps)
- Kie.ai API key in `.env` (supports Kling 3.0, Veo 3.1, Runway Aleph, etc.)
- Song file and lyrics

## Pipeline

### 1. Analyze the Song
- Get duration with `ffprobe`
- Parse lyrics into sections (intro, verse, chorus, bridge, outro)
- Map timing to each section
- Identify energy/mood shifts

### 2. Define Visual Language
Use AUTEUR's `AestheticStyle` + `AuteurLayer.enrich()`:
```python
from auteur.knowledge.styles.aesthetic import AestheticStyle, AuteurLayer

style = AestheticStyle(
    description="your visual reference (e.g. True Detective meets cyberpunk)",
    mood="emotional tone keywords",
    color_feel="color palette description",
    texture="grain, surface quality keywords",
    auteur_weight=0.7  # 0.0-1.0 enrichment intensity
)
style = AuteurLayer.enrich(style)
# Check blend: style.auteur_blend, AuteurLayer.explain_blend(style)
```

### 3. Plan Shots
Use pacing templates from `auteur.agents.director`:
- `establishing_to_intimate` — wide to close
- `tension_build` — escalating close-ups
- `action_sequence` — dynamic movement
- `reveal` — mystery to revelation

Define each shot with:
- `ShotSpec` (description, shot_size, movement, lens, aperture)
- `MovementSpec(movement_type=MovementType.X)`
- `LensSpec(focal_length_mm=N, max_aperture=N.N)`
- `aesthetic_style=master_style.model_dump()`

### 4. Generate Optimized Prompts
```python
from auteur.prompt.composer import PromptComposer

composed = PromptComposer.compose(shot)
optimized = composed.optimize(model="kling-3.0")
# positive, negative, parameters
```

### 5. Generate with Kie.ai
**IMPORTANT**: Kie.ai model names use HYPHENS not underscores for image models.

Image generation (concept art):
```python
# Model: "nano-banana-2" (NOT nano_banana_2)
# Endpoint: /api/v1/jobs/createTask
# Poll: /api/v1/jobs/recordInfo?taskId=...
# Response: resultJson.resultUrls[0]
```

Video generation (Kling 3.0):
```python
# Correct Kie.ai contract from docs:
# Endpoint: POST /api/v1/jobs/createTask
# Model: "kling-3.0/video"
# Required top-level fields: model, input
# Commonly expected fields in input: prompt, sound, duration, aspect_ratio, mode, multi_shots, multi_prompt
# Example payload:
# {
#   "model": "kling-3.0/video",
#   "callBackUrl": "https://your-domain.com/api/callback",   # optional but recommended by docs
#   "input": {
#     "prompt": "...",
#     "sound": false,
#     "duration": "5",
#     "aspect_ratio": "16:9",
#     "mode": "pro",
#     "multi_shots": false,
#     "multi_prompt": []
#   }
# }
# Poll status with GET /api/v1/jobs/recordInfo?taskId=...
# Status field is data.state (waiting/success/fail)
```

### 6. Assemble Video
Use ffmpeg to:
1. Download all generated clips
2. Trim to match song sections
3. Add crossfade transitions (0.8s)
4. Overlay audio track
5. Export final MP4

## Directory Structure
```
project-name/
├── music-video-treatment.md    # Full cinematic treatment
├── generated_prompts.json      # All optimized prompts
├── concept_*.jpg               # Key frame concept art
├── clips/                      # Generated video clips
│   ├── clip_1A.mp4
│   └── ...
└── final/
    └── music_video_final.mp4
```

## Auteur Blend Tips
- Southern Gothic + neon → Storaro (color) + Hoytema (scale) + Deakins (shadow)
- Intimate/emotional → Lubezki + Deakins
- Epic/vast → Hoytema + Storaro
- Gritty/real → Deakins + Bradford Young

## Kie.ai API Notes
- Image endpoint: `POST /api/v1/jobs/createTask`
- Status endpoint: `GET /api/v1/jobs/recordInfo?taskId=...`
- States: `waiting` / `queuing` / `generating` → `success` or `fail`
- Model names: `nano-banana-2`, `gpt-image/1.5-text-to-image`, `flux-kontext`
- Kling 3.0 current model name: `kling-3.0/video`
- Check credits before large batches: `GET https://api.kie.ai/api/v1/chat/credit`
- `code=402` means insufficient credits; stop immediately and top up before retrying
- `code=429` means rate-limited; retry with backoff and smaller batches
