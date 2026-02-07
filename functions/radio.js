export async function onRequest() {
	const url = "https://radio.coreyburns.ca/radio.ogg";

	try {
		const response = await fetch(url);

		// Create a new Response object with the same body but modified headers
		const newHeaders = new Headers(response.headers);
		newHeaders.set("Access-Control-Allow-Origin", "*");

		// We must return a new Response to include the modified headers
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders,
		});
	} catch (err) {
		return new Response("Error fetching audio stream: " + err.message, {
			status: 500,
		});
	}
}
