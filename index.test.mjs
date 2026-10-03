import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "pi-codex-fast-test-"));
const previousHome = process.env.HOME;
process.env.HOME = home;
const { default: codexFast } = await import("./index.ts");
const settingsPath = join(home, ".pi", "agent", "settings.json");

after(() => {
	if (previousHome === undefined) delete process.env.HOME;
	else process.env.HOME = previousHome;
	rmSync(home, { recursive: true, force: true });
});

function setup(provider, enabled = false) {
	mkdirSync(join(home, ".pi", "agent"), { recursive: true });
	writeFileSync(settingsPath, JSON.stringify({ theme: "test", codexFast: { enabled } }));
	const handlers = new Map();
	const commands = new Map();
	const notifications = [];
	const statuses = new Map();
	const ctx = {
		model: provider ? { provider } : undefined,
		ui: {
			notify: (text, level) => notifications.push({ text, level }),
			setStatus: (key, value) => statuses.set(key, value),
		},
	};
	codexFast({
		on: (event, handler) => handlers.set(event, handler),
		registerCommand: (name, command) => commands.set(name, command),
	});
	return { ctx, handlers, notifications, statuses, command: commands.get("codex-fast").handler };
}

test("Codex can enable and disable fast mode while preserving other settings", async () => {
	const app = setup("openai-codex");
	await app.command(" ON ", app.ctx);
	assert.equal(app.statuses.get("codex-fast"), "codex-fast: on");
	assert.deepEqual(JSON.parse(readFileSync(settingsPath, "utf8")), { theme: "test", codexFast: { enabled: true } });
	await app.command("off", app.ctx);
	assert.equal(app.statuses.get("codex-fast"), "codex-fast: off");
	assert.equal(JSON.parse(readFileSync(settingsPath, "utf8")).codexFast.enabled, false);
});

for (const provider of ["openai", "anthropic", undefined]) {
	test(`fast mode cannot be enabled for ${provider ?? "a missing model"}`, async () => {
		const app = setup(provider);
		await app.command("on", app.ctx);
		assert.equal(JSON.parse(readFileSync(settingsPath, "utf8")).codexFast.enabled, false);
		assert.equal(app.statuses.get("codex-fast"), undefined);
		assert.match(app.notifications.at(-1).text, /only available.*openai-codex/);
		assert.equal(app.handlers.get("before_provider_request")({ payload: {} }, app.ctx), undefined);
	});
}

test("status follows provider changes without losing the persisted preference", () => {
	const app = setup("anthropic", true);
	app.handlers.get("session_start")({}, app.ctx);
	assert.equal(app.statuses.get("codex-fast"), undefined);
	app.ctx.model = { provider: "openai-codex" };
	app.handlers.get("model_select")({}, app.ctx);
	assert.equal(app.statuses.get("codex-fast"), "codex-fast: on");
	const payload = { model: "test", input: [] };
	assert.deepEqual(app.handlers.get("before_provider_request")({ payload }, app.ctx), { ...payload, service_tier: "priority" });
	assert.equal(payload.service_tier, undefined);
	app.ctx.model = { provider: "openai" };
	app.handlers.get("model_select")({}, app.ctx);
	assert.equal(app.statuses.get("codex-fast"), undefined);
	assert.equal(app.handlers.get("before_provider_request")({ payload }, app.ctx), undefined);
	assert.equal(JSON.parse(readFileSync(settingsPath, "utf8")).codexFast.enabled, true);
});
