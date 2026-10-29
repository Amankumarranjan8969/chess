import { Puzzle } from '../types/platform.js';
import puzzlesJson from './puzzlesData.json';

export const INITIAL_PUZZLES: Puzzle[] = puzzlesJson as unknown as Puzzle[];
