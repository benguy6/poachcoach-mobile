const axios = require('axios');

async function getGeoFromPostal(postalCode) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=Singapore&format=json`;

    const res = await axios.get(url, {
      headers: { 'User-Agent': 'poachcoach-app' }
    });

    if (res.data && res.data.length > 0) {
      const place = res.data[0];
      return {
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        locationName: place.display_name,
      };
    } else {
      console.log(`Postal code ${postalCode} not found, using default coordinates`);
      // Return default coordinates for Singapore (Marina Bay area)
      return {
        latitude: 1.290270,
        longitude: 103.851959,
        locationName: 'Singapore',
      };
    }
  } catch (error) {
    console.log(`Geolocation error for postal code ${postalCode}:`, error.message);
    // Return default coordinates for Singapore (Marina Bay area)
    return {
      latitude: 1.290270,
      longitude: 103.851959,
      locationName: 'Singapore',
    };
  }
}

module.exports = { getGeoFromPostal };