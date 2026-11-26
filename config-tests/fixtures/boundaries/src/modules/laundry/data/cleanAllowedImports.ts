// Clean: laundry -> wardrobe, storage and core, through index.ts (relative and alias).
import { coreModule } from '@/modules/core';
import { storageModule } from '@/modules/storage';

import { wardrobeModule } from '../../wardrobe';

export const value = [coreModule, storageModule, wardrobeModule];
