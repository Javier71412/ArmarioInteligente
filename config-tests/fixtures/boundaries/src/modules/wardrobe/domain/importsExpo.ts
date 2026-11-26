// Trap: domain/ is pure TypeScript, without Expo.
import { openDatabaseAsync } from 'expo-sqlite';

export const value = openDatabaseAsync;
