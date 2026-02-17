import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/local-stream.ogg": {
				target: "https://radio.coreyburns.ca",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/local-stream\.ogg/, "/radio.ogg"),
			},
		},
	},
});
