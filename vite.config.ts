import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/local-stream.ogg": {
				target: "http://192.168.2.124:8003",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/local-stream\.ogg/, "/radio.ogg"),
			},
		},
	},
});
