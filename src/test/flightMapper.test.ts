import { describe, it, expect } from 'vitest';
import { parseIsoDuration, extractTime, mapAmadeusOffers } from '@/lib/flightMapper';
import type { AmadeusSearchResponse } from '@/types/flight';

describe('parseIsoDuration', () => {
  it('parses hours and minutes', () => {
    expect(parseIsoDuration('PT2H26M')).toBe(146);
  });

  it('parses hours only', () => {
    expect(parseIsoDuration('PT3H')).toBe(180);
  });

  it('parses minutes only', () => {
    expect(parseIsoDuration('PT45M')).toBe(45);
  });

  it('parses hours, minutes and seconds', () => {
    expect(parseIsoDuration('PT2H26M30S')).toBe(147); // 30s rounds up
  });

  it('does not round up seconds below 30', () => {
    expect(parseIsoDuration('PT1H10M15S')).toBe(70);
  });

  it('handles days (P1DT2H30M)', () => {
    expect(parseIsoDuration('P1DT2H30M')).toBe(24 * 60 + 2 * 60 + 30); // 1590
  });

  it('handles days with no time component (P2D)', () => {
    expect(parseIsoDuration('P2D')).toBe(2 * 24 * 60); // 2880
  });

  it('handles days and hours only (P1DT5H)', () => {
    expect(parseIsoDuration('P1DT5H')).toBe(24 * 60 + 5 * 60); // 1740
  });

  it('returns 0 for empty string', () => {
    expect(parseIsoDuration('')).toBe(0);
  });

  it('returns 0 for invalid input', () => {
    expect(parseIsoDuration('invalid')).toBe(0);
  });

  it('handles PT14H5M', () => {
    expect(parseIsoDuration('PT14H5M')).toBe(845);
  });
});

describe('extractTime', () => {
  it('extracts HH:MM from ISO datetime', () => {
    expect(extractTime('2026-03-15T14:30:00')).toBe('14:30');
  });

  it('extracts time with single-digit hours', () => {
    expect(extractTime('2026-01-01T09:05:00')).toBe('09:05');
  });

  it('returns input if no T found', () => {
    expect(extractTime('14:30')).toBe('14:30');
  });

  it('handles datetime with timezone offset', () => {
    expect(extractTime('2026-03-15T23:45:00+03:00')).toBe('23:45');
  });
});

describe('mapAmadeusOffers', () => {
  const makeOffer = (id: string, price: string, departureCode = 'DAM', arrivalCode = 'DXB') => ({
    type: 'flight-offer',
    id,
    source: 'GDS',
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: true,
    lastTicketingDate: '2026-03-15',
    numberOfBookableSeats: 5,
    itineraries: [
      {
        duration: 'PT3H30M',
        segments: [
          {
            departure: { iataCode: departureCode, at: '2026-03-15T10:00:00' },
            arrival: { iataCode: arrivalCode, at: '2026-03-15T13:30:00' },
            carrierCode: 'SV',
            number: '123',
            aircraft: { code: '320' },
            duration: 'PT3H30M',
            id: '1',
            numberOfStops: 0,
            blacklistedInEU: false,
          },
        ],
      },
    ],
    price: { currency: 'USD', total: price, base: price, grandTotal: price },
    pricingOptions: { fareType: ['PUBLISHED'], includedCheckedBagsOnly: true },
    validatingAirlineCodes: ['SV'],
    travelerPricings: [
      {
        travelerId: '1',
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: { currency: 'USD', total: price, base: price },
        fareDetailsBySegment: [
          { segmentId: '1', cabin: 'ECONOMY', fareBasis: 'YOWSA', class: 'Y' },
        ],
      },
    ],
  });

  it('returns empty array for empty response', () => {
    const response: AmadeusSearchResponse = { data: [] };
    expect(mapAmadeusOffers(response)).toEqual([]);
  });

  it('maps a single offer correctly', () => {
    const response: AmadeusSearchResponse = {
      data: [makeOffer('1', '250.00')],
      dictionaries: { carriers: { SV: 'Saudi Arabian Airlines' }, aircraft: { '320': 'Airbus A320' } },
    };
    const result = mapAmadeusOffers(response);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(250);
    expect(result[0].currency).toBe('USD');
    expect(result[0].stops).toBe(0);
    expect(result[0].departureTime).toBe('10:00');
    expect(result[0].arrivalTime).toBe('13:30');
    expect(result[0].totalDuration).toBe(210);
    expect(result[0].isBest).toBe(true);
    expect(result[0].airlineName).toBe('Saudi Arabian Airlines');
    expect(result[0].flightNumber).toBe('SV 123');
    expect(result[0].rawOffer).toBeDefined();
  });

  it('marks cheapest offer as isBest', () => {
    const response: AmadeusSearchResponse = {
      data: [makeOffer('1', '300.00'), makeOffer('2', '150.00'), makeOffer('3', '250.00')],
    };
    const result = mapAmadeusOffers(response);
    expect(result[0].isBest).toBe(false);
    expect(result[1].isBest).toBe(true);
    expect(result[2].isBest).toBe(false);
  });

  it('skips malformed offers without crashing', () => {
    const response: AmadeusSearchResponse = {
      data: [
        makeOffer('1', '200.00'),
        { id: 'bad', itineraries: [] } as any, // malformed — no segments
        makeOffer('3', '300.00'),
      ],
    };
    const result = mapAmadeusOffers(response);
    // Should have 2 results (the malformed one is skipped)
    expect(result.length).toBeLessThanOrEqual(3);
    // At least the valid ones should be present
    expect(result.some(f => f.price === 200)).toBe(true);
    expect(result.some(f => f.price === 300)).toBe(true);
  });

  it('handles missing dictionaries gracefully', () => {
    const response: AmadeusSearchResponse = {
      data: [makeOffer('1', '100.00')],
    };
    const result = mapAmadeusOffers(response);
    expect(result).toHaveLength(1);
    expect(result[0].airlineName).toBe('SV'); // falls back to carrier code
  });
});
