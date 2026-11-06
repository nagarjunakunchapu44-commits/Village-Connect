/*
    Check whether latitude and longitude are valid
*/
exports.isValidCoordinates = (
    latitude,
    longitude
) => {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
        Number.isNaN(lat) ||
        Number.isNaN(lon)
    ) {
        return false;
    }

    if (
        lat < -90 ||
        lat > 90
    ) {
        return false;
    }

    if (
        lon < -180 ||
        lon > 180
    ) {
        return false;
    }

    return true;
};


/*
    Calculate distance between two GPS coordinates.

    Returns distance in kilometres.
*/
exports.calculateDistance = (
    latitude1,
    longitude1,
    latitude2,
    longitude2
) => {
    const toRadians = (value) => {
        return value * Math.PI / 180;
    };

    const earthRadius = 6371;

    const lat1 = toRadians(
        Number(latitude1)
    );

    const lat2 = toRadians(
        Number(latitude2)
    );

    const deltaLat = toRadians(
        Number(latitude2) -
        Number(latitude1)
    );

    const deltaLon = toRadians(
        Number(longitude2) -
        Number(longitude1)
    );

    const a =
        Math.sin(deltaLat / 2) *
        Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadius * c;
};


/*
    Check whether a location is within
    a specified radius in kilometres.
*/
exports.isWithinRadius = (
    latitude1,
    longitude1,
    latitude2,
    longitude2,
    radiusKm
) => {
    const distance =
        exports.calculateDistance(
            latitude1,
            longitude1,
            latitude2,
            longitude2
        );

    return distance <= Number(radiusKm);
};