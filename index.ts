import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type CodexFastMode = "fast" | "off";

const SERVICE_TIER = "priority";

export default function codexFast(pi: ExtensionAPI) {
	let mode: CodexFastMode = "off";

	const statusText = () => `codex-fast: ${mode}`;

	const setMode = (nextMode: CodexFastMode) => {
		mode = nextMode;
	};

	pi.registerCommand("codex-fast", {
		description: "Toggle OpenAI Codex fast mode: /codex-fast fast|off",
		handler: async (args, ctx) => {
			const value = args.trim().toLowerCase();

			if (!value) {
				ctx.ui.notify(`Codex fast mode is ${mode}. Use /codex-fast fast or /codex-fast off.`, "info");
				ctx.ui.setStatus("codex-fast", statusText());
				return;
			}

			if (value !== "fast" && value !== "off") {
				ctx.ui.notify("Usage: /codex-fast fast|off", "error");
				return;
			}

			setMode(value);
			ctx.ui.setStatus("codex-fast", statusText());
			ctx.ui.notify(`Codex fast mode ${value === "fast" ? "enabled" : "disabled"}.`, "info");
		},
	});

	pi.on("session_start", (_event, ctx) => {
		ctx.ui.setStatus("codex-fast", statusText());
	});

	pi.on("model_select", (_event, ctx) => {
		ctx.ui.setStatus("codex-fast", statusText());
	});

	pi.on("before_provider_request", (event, ctx) => {
		if (mode !== "fast") return;
		if (ctx.model?.provider !== "openai-codex") return;
		if (!event.payload || typeof event.payload !== "object") return;

		return {
			...(event.payload as Record<string, unknown>),
			service_tier: SERVICE_TIER,
		};
	});
}
