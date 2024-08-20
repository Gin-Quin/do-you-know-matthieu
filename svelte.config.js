import adapter from "@sveltejs/adapter-cloudflare"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		prerender: {
			entries: ["*"],
			crawl: true,
		},
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			routes: {
				include: ["/api/*"],
				exclude: [
					"/_app/*",
					"/bitmoji/*",
					"/fonts/*",
					"/img/*",
					"/animate.css",
					"/favicon.png",
					"/global.css",
					"/_worker.js",
					"/_worker.js.map",
					"/_headers",
				],
			},
		}),
	},
}

export default config
