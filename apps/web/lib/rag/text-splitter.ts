
export function splitText(text: string, chunkSize = 1000, chunkOverlap = 200): string[] {
    if (!text) return [];

    const chunks: string[] = [];
    let start = 0;

    // If text is shorter than chunk size, return it as is
    if (text.length <= chunkSize) {
        return [text];
    }

    while (start < text.length) {
        // Limit end to text length
        let end = Math.min(start + chunkSize, text.length);

        // If we are at the end, just take the rest
        if (end >= text.length) {
            chunks.push(text.slice(start));
            break;
        }

        // Try to find a natural break point (paragraph, sentence, etc.)
        // We look backwards from the 'end'
        const chunkSlice = text.slice(start, end);

        let splitIndex = -1;

        // Priority 1: New Lines
        const lastNewLine = chunkSlice.lastIndexOf('\n');
        if (lastNewLine > chunkSize * 0.5) {
            splitIndex = lastNewLine;
        }
        // Priority 2: Sentences
        else {
            const lastPeriod = chunkSlice.lastIndexOf('. ');
            if (lastPeriod > chunkSize * 0.5) {
                splitIndex = lastPeriod + 1; // Include the dot
            }
        }

        // If found a good split point, use it
        if (splitIndex !== -1) {
            end = start + splitIndex + 1; // shift to absolute index
            chunks.push(text.slice(start, end));
            // Move start back by overlap, but not behind the current start (infinite loop protection)
            // Actually, usually we set start to end - overlap
            start = end - chunkOverlap;
        } else {
            // Hard split if no good point found
            chunks.push(text.slice(start, end));
            start = end - chunkOverlap;
        }

        // Ensure forward progress
        if (start < 0) start = 0;
    }

    return chunks;
}
