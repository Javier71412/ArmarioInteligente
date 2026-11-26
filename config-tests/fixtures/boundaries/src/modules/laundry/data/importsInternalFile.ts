// Trap: laundry may import wardrobe, but only its index.ts.
import { findGarments } from '../../wardrobe/data/garmentRepository';

export const value = findGarments;
