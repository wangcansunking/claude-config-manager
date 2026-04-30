#!/usr/bin/env bash
# launch-tui.sh — open `claude-config` (the TUI) in a fresh terminal window.
#
# Picks the best terminal emulator for the current OS.
# Exits 0 on successful launch, non-zero (with stderr explaining) when no
# suitable terminal is found.
#
# Designed to be invoked from inside Claude Code's Bash tool.

set -e

# Resolve the binary. Prefer the PATH `claude-config` (when user has done
# `npm link`); fall back to the worktree dist if available.
BIN="${CCM_BIN:-claude-config}"
if ! command -v "$BIN" >/dev/null 2>&1; then
  # Try the local dist path as a worktree-time fallback.
  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  LOCAL_DIST="$REPO_ROOT/packages/cli/dist/index.js"
  if [ -f "$LOCAL_DIST" ]; then
    BIN="node $LOCAL_DIST"
  else
    echo "claude-config binary not found on PATH and no local dist available." >&2
    echo "Run 'npm link' inside packages/cli, or install the package globally." >&2
    exit 2
  fi
fi

uname_s="$(uname -s 2>/dev/null || echo unknown)"

case "$uname_s" in
  Darwin)
    # macOS — use Terminal.app via AppleScript. iTerm2 also supported if running.
    if osascript -e "tell application \"Terminal\" to do script \"$BIN\"" \
                 -e 'tell application "Terminal" to activate' >/dev/null 2>&1; then
      echo "Launched TUI in new Terminal window (macOS)."
      exit 0
    fi
    echo "macOS: failed to launch Terminal.app via osascript." >&2
    exit 3
    ;;

  Linux)
    # Try modern terminals first, fall back to xterm.
    for term_cmd in \
        "gnome-terminal -- $BIN" \
        "konsole -e $BIN" \
        "alacritty -e $BIN" \
        "wezterm start -- $BIN" \
        "kitty $BIN" \
        "xfce4-terminal -e \"$BIN\"" \
        "lxterminal -e \"$BIN\"" \
        "mate-terminal -e \"$BIN\"" \
        "tilix -e \"$BIN\"" \
        "terminator -e \"$BIN\"" \
        "xterm -e $BIN"; do
      term_bin="${term_cmd%% *}"
      if command -v "$term_bin" >/dev/null 2>&1; then
        # shellcheck disable=SC2086
        eval "$term_cmd >/dev/null 2>&1 &"
        disown $! 2>/dev/null || true
        echo "Launched TUI in $term_bin (Linux)."
        exit 0
      fi
    done
    echo "Linux: no supported terminal emulator found on PATH." >&2
    echo "Install one of: gnome-terminal / konsole / alacritty / wezterm / kitty / xterm." >&2
    exit 3
    ;;

  MINGW*|MSYS*|CYGWIN*)
    # Windows via Git Bash / MSYS / Cygwin.
    if command -v wt >/dev/null 2>&1; then
      # Windows Terminal (Win 11 default; downloadable on Win 10).
      wt new-tab --title "claude-config" $BIN >/dev/null 2>&1 &
      disown $! 2>/dev/null || true
      echo "Launched TUI in Windows Terminal."
      exit 0
    elif command -v powershell.exe >/dev/null 2>&1; then
      powershell.exe -NoProfile -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','$BIN'" >/dev/null 2>&1
      echo "Launched TUI in PowerShell window."
      exit 0
    elif command -v cmd.exe >/dev/null 2>&1; then
      cmd.exe /c start cmd /k "$BIN" >/dev/null 2>&1
      echo "Launched TUI in cmd window."
      exit 0
    fi
    echo "Windows: neither Windows Terminal (wt), PowerShell, nor cmd.exe found." >&2
    echo "Install Windows Terminal: https://aka.ms/terminal" >&2
    exit 3
    ;;

  *)
    echo "Unsupported OS: $uname_s" >&2
    echo "Run \"$BIN\" yourself in any terminal, or use the web dashboard via /ccm-dashboard." >&2
    exit 4
    ;;
esac
