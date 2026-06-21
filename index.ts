import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type CodexFastMode = "on" | "off";

const SERVICE_TIER = "priority";

export default function codexFast(pi: ExtensionAPI) {
	let mode: CodexFastMode = "off";

	const statusText = () => `codex-fast: ${mode}`;

	const setMode = (nextMode: CodexFastMode) => {
		mode = nextMode;
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

			setMode(value);
			ctx.ui.setStatus("codex-fast", statusText());
			ctx.ui.notify(`Codex fast mode ${value === "on" ? "enabled" : "disabled"}.`, "info");
		},
	});

	pi.on("session_start", (_event, ctx) => {
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
