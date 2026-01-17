import { RidingLookupResult } from '@/types';

// Endpoints
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
const OPEN_NORTH_API = 'https://represent.opennorth.ca/boundaries/';
const BC_RIDING_SET = 'british-columbia-electoral-districts-2023-redistribution';

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
}

interface OpenNorthResult {
    objects: Array<{
        name: string;
        external_id: string;
    }>;
}

/**
 * Service to identify electoral ridings using OpenStreetMap (Geocoding) and OpenNorth (Boundaries).
 * This provides real-time, accurate riding identification without browser automation.
 */
export const RidingService = {
    /**
     * Identifies a riding from a full street address.
     * Steps:
     * 1. Geocode address to Lat/Lon (Nominatim)
     * 2. Query Electoral Boundary containing that Lat/Lon (OpenNorth)
     */
    lookupByAddress: async (address: string): Promise<RidingLookupResult> => {
        console.log(`[RidingService] Looking up address: ${address}`);

        try {
            // Step 1: Geocode
            const geoUrl = `${NOMINATIM_API}?q=${encodeURIComponent(address)}&format=json&limit=1`;
            const geoResponse = await fetch(geoUrl);

            if (!geoResponse.ok) throw new Error('Geocoding service unavailable');

            const geoData = (await geoResponse.json()) as NominatimResult[];

            if (!geoData || geoData.length === 0) {
                return {
                    riding: 'Address not found',
                    confidence: 'none',
                    needs_review: true,
                    source: 'address'
                };
            }

            const { lat, lon } = geoData[0];
            console.log(`[RidingService] Geocoded to: ${lat}, ${lon}`);

            // Step 2: Boundary Lookup
            const boundaryUrl = `${OPEN_NORTH_API}?contains=${lat},${lon}&sets=${BC_RIDING_SET}`;
            const boundaryResponse = await fetch(boundaryUrl);

            if (!boundaryResponse.ok) throw new Error('Boundary service unavailable');

            const boundaryData = (await boundaryResponse.json()) as OpenNorthResult;

            if (boundaryData.objects && boundaryData.objects.length > 0) {
                const district = boundaryData.objects[0];
                const formattedName = district.external_id
                    ? `${district.name} (${district.external_id})`
                    : district.name;

                return {
                    riding: formattedName,
                    confidence: 'high',
                    needs_review: false,
                    source: 'address'
                };
            }

            return {
                riding: 'Outside defined boundaries',
                confidence: 'low',
                needs_review: true,
                source: 'address'
            };

        } catch (error) {
            console.error('Riding lookup failed', error);
            return {
                riding: 'Service Error - Try Manual',
                confidence: 'none',
                needs_review: true,
                source: 'address'
            };
        }
    },

    /**
     * Identifies riding from postal code (fallback method).
     * Could also use OpenNorth's /postcodes/ endpoint.
     */
    lookupByPostalCode: async (postalCode: string): Promise<RidingLookupResult> => {
        // Basic prefix map from our mock data (fast fallback)
        const prefix = postalCode.toUpperCase().replace(/\s/g, '').substring(0, 3);

        // Check local cache/map first (fastest)
        const riding = postalCodeToRiding[prefix];
        if (riding) {
            return { riding, confidence: 'medium', needs_review: false, source: 'postal_code' };
        }

        // Try OpenNorth API for Postal Code
        try {
            const cleanPostCode = postalCode.replace(/\s/g, '');
            const url = `https://represent.opennorth.ca/postcodes/${cleanPostCode}/?sets=${BC_RIDING_SET}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                if (data.boundaries_centroid && data.boundaries_centroid.length > 0) {
                    return {
                        riding: data.boundaries_centroid[0].name,
                        confidence: 'medium',
                        needs_review: false,
                        source: 'postal_code'
                    };
                }
            }
        } catch (e) {
            console.warn('Postal API failed', e);
        }

        if (prefix.startsWith('V')) {
            return {
                riding: 'Unknown BC Riding',
                confidence: 'low',
                needs_review: true,
                source: 'postal_code'
            };
        }

        return {
            riding: 'Outside BC',
            confidence: 'none',
            needs_review: true,
            source: 'postal_code'
        };
    }
};

// Simplified Fallback Map
const postalCodeToRiding: Record<string, string> = {
    'V6B': 'Vancouver-False Creek',
    'V6C': 'Vancouver-Coal Harbour',
    'V5H': 'Burnaby North',
    'V3T': 'Surrey-Whalley',
    'V3R': 'Surrey-Whalley',
    // ... (keeping relevant fallbacks)
};
