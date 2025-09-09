/**
 * Create a {@link PositionCalculator} for a file that can be used to compute the position (line and
 * character) of a given character offset in the file.
 */
export function createFilePositionCalculator(content) {
    const lines = content.split('\n');
    return (offset) => {
        let line = 0;
        let character = 0;
        while (line < lines.length && offset > 0) {
            const lineLength = lines[line].length + 1; // +1 for the newline
            if (lineLength > offset) {
                character = offset;
                break;
            }
            offset -= lineLength;
            line += 1;
        }
        return { line, character };
    };
}
//# sourceMappingURL=position.js.map