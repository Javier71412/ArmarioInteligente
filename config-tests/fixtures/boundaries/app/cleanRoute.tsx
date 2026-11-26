// Clean: routes may import the index.ts of any module.
import { todayModule } from '@/modules/today';
import { wardrobeModule } from '@/modules/wardrobe';

export default function Route(): null {
  void [todayModule, wardrobeModule];
  return null;
}
