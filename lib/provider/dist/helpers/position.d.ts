import type { Position } from '@openctx/schema';
export type PositionCalculator = (offset: number) => Position;
/**
 * Create a {@link PositionCalculator} for a file that can be used to compute the position (line and
 * character) of a given character offset in the file.
 */
export declare function createFilePositionCalculator(content: string): PositionCalculator;
//# sourceMappingURL=position.d.ts.map