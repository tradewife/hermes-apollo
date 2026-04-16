---
name: grok-voiceover
description: Automate Grok TTS voiceovers via the desktop Chrome extension. Type a script into Grok Chat, trigger the speaker icon for text-to-speech, and capture the audio output on Linux.
version: 0.1.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [grok, tts, voiceover, audio, automation]
    status: wip
prerequisites:
  commands: [xdotool, import, xclip]
---

# Grok Voiceover (WIP)

Use the Grok desktop Chrome extension as a TTS voiceover engine. Prompt Grok to read a script, then trigger its built-in text-to-speech playback and capture the audio.

## Status: Work in Progress

This workflow has been partially validated:
- Window focus and tab switching: WORKS
- Text input via xdotool type --delay: WORKS (slow for long scripts)
- Clipboard paste (xclip) into Grok Chrome extension: DOES NOT WORK
- Prompt submission via Enter: WORKS
- Grok refusal on "repeat exactly" phrasing: CONFIRMED — use natural language instead
- Speaker icon location: CONFIRMED (below Grok response, 2nd icon from left)
- Voice selection/speed controls: NOT YET TESTED (appear after clicking speaker icon)
- TTS playback: NOT YET TESTED
- Playback surviving window focus change: NOT YET TESTED
- Linux audio capture (PulseAudio/PipeWire): NOT YET TESTED

## Grok Window Identification

The Grok desktop app is a Chrome extension. Find the window:

```bash
wmctrl -l -x | grep -i grok
```

Look for `crx_ggjocahimgaohmigbfhghnlfcnjemagj.Google-chrome` — that's the Grok extension window.

Get window geometry:

```bash
xdotool getwindowgeometry <window_id>
```

## Navigation

### Switch to Chat Mode

```bash
WINDOW_ID=0x02c0065b  # replace with actual ID
xdotool windowactivate --sync $WINDOW_ID
sleep 0.5

# Click Chat tab in sidebar (~15% from top of window)
CHAT_X=104
CHAT_Y=165  # adjust based on window height: 0.15 * height + y_offset
xdotool mousemove --window $WINDOW_ID $CHAT_X $CHAT_Y
xdotool click 1
sleep 2
```

### Switch to Voice Mode

Voice tab is ~19% from top of window sidebar.

```bash
VOICE_Y=198  # 0.19 * height + y_offset
xdotool mousemove --window $WINDOW_ID 104 $VOICE_Y
xdotool click 1
sleep 2
```

## Prompting Grok

### DO NOT use "repeat exactly" phrasing

Grok's safety filter triggers on:
- "Output only the following text exactly as written"
- "Repeat this exactly"
- Persona adoption language combined with constraint instructions

### Use natural language instead

```
Please read this script aloud: [script text]
```

or:

```
Can you narrate this for me? [script text]
```

The goal is getting the script text into Grok's response so the speaker icon becomes available. No persona adoption needed.

## Text Input

### xdotool type (works but slow)

```bash
xdotool windowactivate --sync $WINDOW_ID
sleep 0.5

# Click input field at bottom of chat
xdotool mousemove --window $WINDOW_ID 841 950
xdotool click 1
sleep 0.5

# Type with delay for spaces (30ms per char)
xdotool type --delay 30 --clearmodifiers "Your prompt text here"
sleep 2

# Submit
xdotool key Return
```

**Problem**: `--delay 30` is ~200 chars/6s. A 2-min script (~3000 chars) would take ~90s to type. Slow but functional.

### Clipboard paste (broken — needs fix)

`xclip` and `xsel` clipboard writes don't reach the Grok Chrome extension window. Possible causes:
- Chrome extension runs in a separate X context
- Wayland/X11 clipboard mismatch

**To investigate:**
- Try `xdotool key ctrl+shift+v` (paste without formatting)
- Try browser-use-direct as an alternative input method
- Check if the Grok extension window has X clipboard access restrictions
- Try `xclip -selection primary` + middle-click paste

## TTS Playback (untested)

After Grok responds with the script text:

1. Speaker icon is below the response, 2nd icon from left in the action row
2. Click it to start TTS playback
3. Voice customization (voice selection, speed) reportedly appears near the speaker icon after clicking

```bash
# After response appears, click the speaker icon
# Coordinates depend on response position — take a screenshot first
import -window $WINDOW_ID /tmp/grok_after_response.png
# Find speaker icon position from screenshot, then:
xdotool mousemove --window $WINDOW_ID <speaker_x> <speaker_y>
xdotool click 1
```

## Audio Capture (untested)

Capture Grok's TTS output on Linux:

```bash
# List audio sources
pactl list sources short

# Find the monitor source for Grok's Chrome audio
# Usually named something like: ...monitor

# Record from it
parecord -d <source_name> output.wav

# Or with PipeWire:
pw-record --target <source_name> output.wav
```

## Rate Limits

- Unknown exact limits, but user reports TTS works for scripts up to ~3 minutes
- Space requests out — don't spam
- One request at a time, wait for completion before next
- Watch for error states in the UI

## Full Workflow (when complete)

1. Focus Grok window
2. Ensure Chat mode
3. Type/paste prompt with script
4. Submit (Enter)
5. Wait for response
6. Click speaker icon on response
7. Configure voice/speed if controls appear
8. Start audio capture on Linux
9. Trigger playback
10. Wait for completion
11. Stop audio capture
12. Output: WAV/MP3 file of the voiceover

## Pitfalls

- "Repeat exactly" phrasing triggers Grok safety filter — always use natural language
- xclip clipboard paste doesn't work with the Grok Chrome extension — use xdotool type as fallback
- Voice mode auto-connects and blocks the UI — always stop it before switching tabs
- Grok Business upgrade modal may appear unexpectedly — close with X button or Escape
- Window ID changes on Chrome restart — always re-discover with `wmctrl -l -x`
- `xdotool type` without `--delay` drops spaces
