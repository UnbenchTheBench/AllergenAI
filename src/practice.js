
/*
import useGeolocation from "./hooks/useGeolocation";

const { coords, error } = useGeolocation();
if (!coords) {
    console.error("Geolocation not available");
}*/

const coords = {};

const {lat, lon } = coords || {lat: 10, lon: 20};

async function getWeatherData(days) {
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=3e0a80a10d8d441799d175849252009&q=20,%2020&days=${days}&q=${lat},${lon}`);

    if (!response.ok) {
        throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();
    return data;
}


async function getPollenLevel() {

}

async function main() {
    try {
        const date = await getWeatherData(5, 4);
        console.log(date);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();