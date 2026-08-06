// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const excludedSitemapPaths = ["/interno", "/organigrama"];

export default defineConfig({
	site: "https://ucbcristoalmundo.cl",
	adapter: cloudflare(),
	integrations: [
		sitemap({
			filter: (page) => {
				let pathname = "";
				try {
					pathname = new URL(page).pathname.replace(/\/+$/, "") || "/";
				} catch {
					return false;
				}
				return !excludedSitemapPaths.some(
					(excludedPath) =>
						pathname === excludedPath ||
						pathname.startsWith(`${excludedPath}/`),
				);
			},
		}),
	],
	vite: {
		plugins: [tailwindcss()],
		mode: "server",
		optimizeDeps: {
			include: ["astro-leaflet > leaflet"],
		},
		build: {
			minify: false,
		},
	},
});
