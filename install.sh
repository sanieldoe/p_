#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
#  Pinnochio (P_) — full installer
#  curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/pinnochio/main/install.sh | bash
#
#  Installs: Ollama, gemma4, Bun, Pinnochio
#  Supports: macOS (arm64/x86_64), Linux (x86_64/arm64)
# ─────────────────────────────────────────────────────────────

REPO="sanieldoe/p_"
INSTALL_DIR="$HOME/.pinnochio"
BIN_DIR="$HOME/.local/bin"

info()    { printf "\033[1;33m⠋\033[0m  %s\n" "$*"; }
ok()      { printf "\033[1;32m✓\033[0m  %s\n" "$*"; }
warn()    { printf "\033[1;35m!\033[0m  %s\n" "$*"; }
err()     { printf "\033[1;31m✗\033[0m  %s\n" "$*" >&2; exit 1; }
section() { printf "\n\033[1;37m%s\033[0m\n%s\n" "$*" "─────────────────────────────"; }

OS="$(uname -s)"
ARCH="$(uname -m)"

section "Pinnochio (P_) installer"
echo "  OS:   $OS ($ARCH)"
echo "  Bun:  will install if missing"
echo "  LLM:  gemma4 via Ollama"
echo ""

# ── 1. Bun ────────────────────────────────────────────────
section "Bun"
if ! command -v bun &>/dev/null; then
  info "Installing Bun…"
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  ok "Bun installed ($(bun --version))"
else
  ok "Bun already installed ($(bun --version))"
fi

# ── 2. Ollama ─────────────────────────────────────────────
section "Ollama"
if ! command -v ollama &>/dev/null; then
  info "Ollama not found — installing…"

  if [ "$OS" = "Darwin" ]; then
    # macOS: try brew first, fall back to download instructions
    if command -v brew &>/dev/null; then
      info "Installing via Homebrew…"
      brew install ollama
      ok "Ollama installed via Homebrew"
    else
      # Download the macOS app automatically
      info "Downloading Ollama for macOS…"
      TMPDIR_OLLAMA="$(mktemp -d)"
      curl -fsSL "https://ollama.ai/download/Ollama-darwin.zip" -o "$TMPDIR_OLLAMA/Ollama.zip"
      unzip -q "$TMPDIR_OLLAMA/Ollama.zip" -d "$TMPDIR_OLLAMA"
      if [ -d "$TMPDIR_OLLAMA/Ollama.app" ]; then
        cp -r "$TMPDIR_OLLAMA/Ollama.app" /Applications/Ollama.app
        # Symlink the CLI binary
        ln -sf /Applications/Ollama.app/Contents/MacOS/ollama /usr/local/bin/ollama 2>/dev/null || \
          sudo ln -sf /Applications/Ollama.app/Contents/MacOS/ollama /usr/local/bin/ollama
        ok "Ollama.app installed — you can also launch it from /Applications"
      else
        rm -rf "$TMPDIR_OLLAMA"
        err "Could not install Ollama automatically.
  Please install it manually:
    • macOS: https://ollama.ai/download
    • Or: brew install ollama
  Then re-run this installer."
      fi
      rm -rf "$TMPDIR_OLLAMA"
    fi

  elif [ "$OS" = "Linux" ]; then
    # Linux: official install script
    info "Installing via official Ollama script…"
    curl -fsSL https://ollama.ai/install.sh | sh
    ok "Ollama installed"

  else
    err "Unsupported OS: $OS. Install Ollama manually from https://ollama.ai then re-run."
  fi
else
  ok "Ollama already installed ($(ollama --version 2>/dev/null || echo 'unknown version'))"
fi

# ── 3. Start Ollama if not running ───────────────────────
section "Ollama service"
if ! curl -sf http://localhost:11434 &>/dev/null; then
  info "Starting Ollama in the background…"
  if [ "$OS" = "Darwin" ] && [ -d "/Applications/Ollama.app" ]; then
    open -a Ollama
  else
    ollama serve &>/dev/null &
  fi
  # Wait up to 10 s for the server to be ready
  ATTEMPTS=0
  until curl -sf http://localhost:11434 &>/dev/null || [ $ATTEMPTS -ge 20 ]; do
    sleep 0.5
    ATTEMPTS=$((ATTEMPTS + 1))
  done
  if ! curl -sf http://localhost:11434 &>/dev/null; then
    warn "Ollama server didn't start automatically."
    warn "Run 'ollama serve' in another terminal, then re-run this installer."
    exit 1
  fi
  ok "Ollama server is up"
else
  ok "Ollama server already running"
fi

# ── 4. Pull model ─────────────────────────────────────────
section "Model: gemma4"
if ollama list 2>/dev/null | grep -q "gemma4"; then
  ok "gemma4 already pulled"
else
  info "Pulling gemma4 (~9 GB — grab a coffee ☕)…"
  ollama pull gemma4
  ok "gemma4 ready"
fi

# ── 5. Clone / update Pinnochio ──────────────────────────
section "Pinnochio"
if [ -d "$INSTALL_DIR/.git" ]; then
  info "Updating existing install…"
  git -C "$INSTALL_DIR" pull --ff-only origin main 2>/dev/null || \
    git -C "$INSTALL_DIR" pull origin main
  ok "Updated to latest"
else
  info "Cloning pinnochio…"
  git clone "https://github.com/$REPO.git" "$INSTALL_DIR"
  ok "Cloned"
fi

# ── 6. Install JS deps ────────────────────────────────────
info "Installing dependencies…"
(cd "$INSTALL_DIR" && bun install --frozen-lockfile 2>/dev/null || bun install)
ok "Dependencies ready"

# ── 7. Link binary ────────────────────────────────────────
mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/bin/p_" "$BIN_DIR/p_"
chmod +x "$INSTALL_DIR/bin/p_"

# ── 8. PATH check ─────────────────────────────────────────
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  SHELL_NAME="$(basename "${SHELL:-bash}")"
  case "$SHELL_NAME" in
    zsh)  RC="$HOME/.zshrc" ;;
    fish) RC="$HOME/.config/fish/config.fish" ;;
    *)    RC="$HOME/.bashrc" ;;
  esac
  echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$RC"
  warn "Added $BIN_DIR to PATH in $RC"
  warn "Restart your shell or run:  export PATH=\"$BIN_DIR:\$PATH\""
fi

# ── Done ──────────────────────────────────────────────────
echo ""
printf "\033[1;32m✓  All done!\033[0m\n"
echo ""
echo "  Start Pinnochio:"
echo "    p_"
echo ""
echo "  Or run directly:"
echo "    cd $INSTALL_DIR && bun run start"
echo ""
echo "  Keep Ollama running in the background:"
echo "    ollama serve   (Linux / manual)"
echo "    open -a Ollama (macOS)"
echo ""
