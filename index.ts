import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type CodexFastMode = "on" | "off";
type Settings = Record<string, unknown> & {
	codexFast?: {
		enabled?: boolean;
	};
};

const SERVICE_TIER = "priority";
const SETTINGS_PATH = join(homedir(), ".pi", "agent", "settings.json");

function readSettings(): Settings {
	if (!existsSync(SETTINGS_PATH)) return {};

	const raw = readFileSync(SETTINGS_PATH, "utf8").trim();
	if (!raw) return {};

	return JSON.parse(raw) as Settings;
}

function writeSettings(settings: Settings) {
	mkdirSync(dirname(SETTINGS_PATH), { recursive: true });

	const tmpPath = `${SETTINGS_PATH}.tmp-${process.pid}`;
	writeFileSync(tmpPath, `${JSON.stringify(settings, null, 2)}\n`);
	renameSync(tmpPath, SETTINGS_PATH);
}

function readPersistedMode(): CodexFastMode {
	try {
		return readSettings().codexFast?.enabled ? "on" : "off";
	} catch {
		return "off";
	}
}

function persistMode(mode: CodexFastMode) {
	const settings = readSettings();
	settings.codexFast = {
		...(settings.codexFast ?? {}),
		enabled: mode === "on",
	};
	writeSettings(settings);
}

export default function codexFast(pi: ExtensionAPI) {
	let mode: CodexFastMode = readPersistedMode();

	const statusText = () => `codex-fast: ${mode}`;

	const setMode = (nextMode: CodexFastMode) => {
		mode = nextMode;
		persistMode(nextMode);
	};

	pi.registerCommand("codex-fast", {
		description: "Toggle OpenAI Codex fast mode: /codex-fast on|off",
		handler: async (args, ctx) => {
			const value = args.trim().toLowerCase();

			if (!value) {
				ctx.ui.notify(`Codex fast mode is ${mode}. Use /codex-fast on or /codex-fast off.`, "info");
				ctx.ui.setStatus("codex-fast", statusText());
				return;
			}

			if (value !== "on" && value !== "off") {
				ctx.ui.notify("Usage: /codex-fast on|off", "error");
				return;
			}

			try {
				setMode(value);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`Failed to save codex fast setting: ${message}`, "error");
				return;
			}

			ctx.ui.setStatus("codex-fast", statusText());
			ctx.ui.notify(`Codex fast mode ${value === "on" ? "enabled" : "disabled"}.`, "info");
		},
	});

	pi.on("session_start", (_event, ctx) => {
		mode = readPersistedMode();
		ctx.ui.setStatus("codex-fast", statusText());
	});

	pi.on("model_select", (_event, ctx) => {
		ctx.ui.setStatus("codex-fast", statusText());
	});

	pi.on("before_provider_request", (event, ctx) => {
		if (mode !== "on") return;
		if (ctx.model?.provider !== "openai-codex") return;
		if (!event.payload || typeof event.payload !== "object") return;

		return {
			...(event.payload as Record<string, unknown>),
			service_tier: SERVICE_TIER,
		};
	});
}
