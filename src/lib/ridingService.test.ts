import { describe, it, expect } from 'vitest';
import { RidingService } from './ridingService';

describe('RidingService', () => {
    it('should correctly identify the demo address', async () => {
        const address = '14408 Chartwell Dr, Surrey';
        const result = await RidingService.lookupByAddress(address);

        expect(result.riding).toBe('Surrey-Fleetwood (SRF)');
        expect(result.confidence).toBe('high');
        expect(result.source).toBe('address');
    });

    it('should fallback to Needs Review for unknown addresses', async () => {
        const address = '123 Unknown St, Nowhere';
        const result = await RidingService.lookupByAddress(address);

        expect(result.riding).toContain('Address not found');
        expect(result.confidence).toBe('none');
    });

    it('should identify riding by postal code', async () => {
        const postalCode = 'V6B 1A1';
        const result = await RidingService.lookupByPostalCode(postalCode);

        expect(result.riding).toBe('Vancouver-False Creek');
        expect(result.confidence).toBe('medium');
    });
});
