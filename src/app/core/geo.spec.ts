import { parseLatLon, toUtm } from './geo';

describe('geo', () => {
  it('parses lat/lon in several formats', () => {
    expect(parseLatLon('-33.4489, -70.6693')).toEqual({ lat: -33.4489, lon: -70.6693 });
    expect(parseLatLon('-33,4489 ; -70,6693')).toEqual({ lat: -33.4489, lon: -70.6693 });
    expect(parseLatLon('hello')).toBeNull();
    expect(parseLatLon('200, 10')).toBeNull();
  });

  it('converts Santiago to UTM 19S', () => {
    // Plaza de Armas: ~153 km west of the zone-19 central meridian (-69°) → E ≈ 346.6 km;
    // ~3.7e6 m south of the equator → N ≈ 6.299e6 m.
    const u = toUtm({ lat: -33.4372, lon: -70.6506 });
    expect(u.zone).toBe(19);
    expect(u.hemisphere).toBe('S');
    expect(Math.abs(u.northing - 6299025)).toBeLessThan(50);
    expect(Math.abs(u.easting - 346564)).toBeLessThan(50);
  });

  it('uses zone 18 west of 72°W (e.g. Chiloé)', () => {
    expect(toUtm({ lat: -42.5, lon: -73.8 }).zone).toBe(18);
  });

  it('equator at the central meridian gives E 500000, N 0', () => {
    const u = toUtm({ lat: 0, lon: -75 });
    expect(Math.round(u.easting)).toBe(500000);
    expect(Math.round(u.northing)).toBe(0);
  });
});
