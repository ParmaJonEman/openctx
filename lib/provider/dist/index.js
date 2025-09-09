// Import from a subpackage because the main module calls `os.platform()`, which doesn't work on
// non-Node engines.
import matchGlob from 'picomatch/lib/picomatch.js';
export { createFilePositionCalculator } from './helpers/position.js';
// For convenience, since many providers need globs.
export { matchGlob };
//# sourceMappingURL=index.js.map