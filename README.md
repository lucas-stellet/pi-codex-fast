# pi-codex-fast

Minimal [pi](https://github.com/earendil-works/pi) extension to toggle fast mode for the `openai-codex` provider.

## Usage

Enable fast mode:

```text
/codex-fast on
```

Disable fast mode:

```text
/codex-fast off
```

When enabled, the extension adds `service_tier: "priority"` to provider requests only when the active model provider is `openai-codex`.

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
