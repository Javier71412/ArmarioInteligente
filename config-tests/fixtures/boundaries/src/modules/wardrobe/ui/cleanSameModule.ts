// Clean: inside one module, imports are free.
import { findGarments } from '../data/garmentRepository';
import type { Garment } from '../domain/garment';

export const value: [typeof findGarments, Garment | null] = [findGarments, null];
