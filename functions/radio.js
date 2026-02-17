export async function onRequest() {
	const url = "https://radio.coreyburns.ca/radio.ogg";

	try {
		const response = await fetch(url, {
			headers: { "User-Agent": "Cloudflare-Worker" },
		});

		if (!response.ok) {
			return new Response(
				`Error: Radio server returned ${response.status} ${response.statusText}`,
				{
					status: response.status,
					headers: { "Access-Control-Allow-Origin": "*" },
				},
			);
		}

		// Create a new Response object with the same body but modified headers
		const newHeaders = new Headers(response.headers);
		newHeaders.set("Access-Control-Allow-Origin", "*");
		// Ensure it doesn't try to cache the stream
		newHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

		// We must return a new Response to include the modified headers
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders,
		});
	} catch (err) {
		return new Response(`Error fetching audio stream: ${err.message}`, {
			status: 500,
			headers: { "Access-Control-Allow-Origin": "*" },
		});
	}
}
