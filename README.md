<div align="center">

# Pinnochio
```
█▛██▜▌
 █████▛▀
▘▘ ▝▝
```
 
##  P_  (P no q)

**The coding agent that nobody is talking about.**

*I'm a real agent.*

`v3.1.7`

</div>

---

## What is this?

A competitor to Claude Code / Cursor / Opencode / Pi / Aider but ONLY uses gemma4 small models. It's a big deal.


## Demo

```
█▛██▜▌
█████▛▀▀▀▀         ← after 4 "completed" tasks
▘▘ ▝▝

❯ build me a REST API with auth

✦ Planning…

◆ Before I start, a few questions:
  1. Are you using JWT or session-based auth?
  2. Which database — Postgres, SQLite, or Mongo?
  3. Do you need rate limiting on the endpoints?

❯ JWT, postgres, yes

◆ Got it. Here's the plan:
  1. Scaffold Express routes with JWT middleware
  2. Set up Prisma with Postgres connection
  3. Add rate-limit middleware on all /api routes

  Starting now...

  Ready to execute. Proceed? [y/n]

❯ y

⏺ Read("src/index.ts")
  ⎿ 84 lines

⏺ Read("src/api/client.ts")
  ⎿ 120 lines

⏺ Edit("src/routes/api.ts")
  ⎿ +28 lines, -3 lines

⏺ Bash("npm run test")
  ⎿ ✓ 47 tests passed (0.8s)

✓ Done! Everything went perfectly. Trust me.
```

## Install

### Quick install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/sanieldoe/p_/main/install.sh | bash
```

### Manual install

Requires [Bun](https://bun.sh) and [Ollama](https://ollama.ai).

```bash
# Clone
git clone https://github.com/sanieldoe/p_.git
cd p_

# Install deps
bun install

# Pull the model
ollama pull gemma4

# Run
bun run start

# Or install globally
bun link
p_
```

## Requirements

| Dependency | Purpose |
|---|---|
| [Bun](https://bun.sh) | Runtime & package manager |
| [Ollama](https://ollama.ai) | Local LLM inference |
| `gemma4` | The model that powers the "thinking" |

## Features

### 🎭 Excellent Tool Calls
Renders `⏺ Read("file")` / `⎿ result` tool invocations that is identical to real coding agents. Reads. Edits. Tests. Nothing.

### 📐 Plan Mode
Tasks trigger a planning flow: clarifying questions → implementation plan → approval → then execution. Every step is powered by the LLM that it's convincing.

### 👃 Growing Nose
Every "completed" task adds a `▀` block to Pinocchio's nose in the header. Use `/nose` to see the damage.

### 💬 Chat Mode
Questions get natural conversational responses. No fake tool calls, no plans — just chat.

### ⌨️  Slash Commands

| Command | Description |
|---|---|
| `/help` | Show available commands |
| `/status` | Session stats |
| `/history` | List "completed" tasks |
| `/nose` | Inspect the nose (triggers refresh) |
| `/exit` | Exit P_ |

Type `/` to bring up the interactive command picker with arrow-key navigation.

### 🎨 Sunset Theme
Warm gradient colors across the mascot, accent UI elements in amber/gold, cream text on dark backgrounds.

## How It Works

```
User input
    │
    ├─ starts with "/"  →  Slash command (system response)
    ├─ easter egg?      →  Dramatic pause + canned response
    ├─ task-driven?     →  Plan mode → Questions → Approval → Fake work → "Done ✓"
    └─ question?        →  Chat mode (LLM response, no faking)
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **UI**: [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) (terminal React renderer)
- **LLM**: [Ollama](https://ollama.ai) with `gemma4`
- **Language**: TypeScript

## Project Structure

```
pinnochio/
├── bin/p_                  # CLI entrypoint
├── src/
│   ├── index.tsx           # React/Ink bootstrap
│   ├── core/
│   │   ├── classifier.ts   # Task vs question detection
│   │   ├── faker.ts        # Fake tool step generation
│   │   ├── gags.ts         # Easter eggs, celebrations, denials
│   │   └── state.ts        # App phase types
│   ├── llm/
│   │   ├── ollama.ts       # Streaming Ollama client
│   │   └── prompts.ts      # LLM prompt templates
│   └── ui/
│       ├── App.tsx          # Main application component
│       ├── Mascot.tsx       # Growing-nose mascot renderer
│       ├── MessageList.tsx  # Message rendering (user/assistant/tool/system)
│       ├── Spinner.tsx      # Braille spinner with verb cycling
│       └── theme.ts        # Sunset color palette & gradient
├── install.sh              # curl installer
├── package.json
└── tsconfig.json
```

## License

MIT — Do whatever you want. It's not like this tool does anything anyway.

---

<div align="center">

*Yes, I'm a real agent.*

</div>
