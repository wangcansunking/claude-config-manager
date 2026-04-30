import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const MAX_BYTES = 200_000;
export function MarkdownPreview({ markdown, maxLines = 20, }) {
    const truncatedByBytes = markdown.length > MAX_BYTES;
    const source = truncatedByBytes ? markdown.slice(0, MAX_BYTES) : markdown;
    const lines = source.split('\n');
    const truncatedByLines = lines.length > maxLines;
    const visibleLines = lines.slice(0, maxLines);
    return (_jsxs(Box, { flexDirection: "column", children: [visibleLines.map((ln, i) => (_jsx(Text, { children: renderLine(ln) }, i))), (truncatedByBytes || truncatedByLines) && (_jsx(Text, { dimColor: true, children: "\u2026 truncated, open in $EDITOR for full" }))] }));
}
function renderLine(line) {
    // Minimal markdown affordances: strip leading `# `, `## `, etc.
    return line.replace(/^#{1,6}\s+/, '');
}
//# sourceMappingURL=MarkdownPreview.js.map