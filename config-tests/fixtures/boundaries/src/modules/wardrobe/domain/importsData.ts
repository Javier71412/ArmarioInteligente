// Trap: domain/ never imports its own data/.
import { findGarments } from '../data/garmentRepository';

export const value = findGarments;
