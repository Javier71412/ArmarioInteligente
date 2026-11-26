import { pickWarmest } from './pickWarmest';

test('returns null for no garments', () => {
  expect(pickWarmest([])).toBeNull();
});

test('returns the highest warmth level', () => {
  expect(pickWarmest([1, 3, 2])).toBe(3);
});
