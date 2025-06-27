const axios = require('axios');

async function getGeoFromPostal(postalCode) {
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
    throw new Error('Postal code not found');
  }
}

module.exports = { getGeoFromPostal };
