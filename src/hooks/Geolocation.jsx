export async function GET(request) {
  const POLLEN_API_KEY = process.env.POLLEN_API_KEY;
  const { searchParams } = new URL(request.url);

  // Default values (Houston)
  const lat = searchParams.get("lat") || 29.717872817349807;
  const lon = searchParams.get("lon") || -95.40275915658768;

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
