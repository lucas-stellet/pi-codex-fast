# pi-codex-fast

Minimal [pi](https://github.com/earendil-works/pi) extension to toggle fast mode for the `openai` provider.

## Usage

The command and status indicator are only available when the active model provider is `openai`. With another provider (or no selected model), the command reports that it is unavailable and does not change the saved setting. The command may still appear in pi's command list.

Enable fast mode:

```text
/codex-fast on
```

Disable fast mode:

```text
/codex-fast off
```

When enabled, the extension adds `service_tier: "priority"` to provider requests only when the active model provider is `openai`. Switching providers hides the status indicator without clearing the saved preference; switching back to OpenAI restores it.

The `/codex-fast` command and `codexFast` setting names are kept for compatibility. The `openai-codex` provider is not supported.

The setting is persisted globally in `~/.pi/agent/settings.json`:

```json
{
  "codexFast": {
    "enabled": true
  }
}
```

## Install

Install as a pi package from GitHub:

```bash
pi install git:github.com/lucas-stellet/pi-codex-fast
```

Or clone it and load the extension locally:

```bash
pi -e ./index.ts
```
