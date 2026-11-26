// Trap: routes only import a module's index.ts.
import { findGarments } from '@/modules/wardrobe/data/garmentRepository';

export default function Route(): null {
  void findGarments;
  return null;
}
