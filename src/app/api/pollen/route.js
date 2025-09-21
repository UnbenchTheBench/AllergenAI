export async function GET(request) {
  const POLLEN_API_KEY = process.env.POLLEN_API_KEY; // automatically available
  const { searchParams } = new URL(request.url);
  const lat = 29.717872817349807;
  const lon = -95.40275915658768;

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "Missing lat/lon" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(
      `https://api.ambeedata.com/latest/pollen/by-lat-lng?lat=${lat}&lng=${lon}`,
      {
        headers: {
          "x-api-key": POLLEN_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
