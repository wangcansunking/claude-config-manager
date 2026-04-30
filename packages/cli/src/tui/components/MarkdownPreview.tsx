import { Box, Text } from 'ink';

const MAX_BYTES = 200_000;

export function MarkdownPreview({
  markdown, maxLines = 20,
}: { markdown: string; maxLines?: number }) {
  const truncatedByBytes = markdown.length > MAX_BYTES;
  const source = truncatedByBytes ? markdown.slice(0, MAX_BYTES) : markdown;
  const lines = source.split('\n');
  const truncatedByLines = lines.length > maxLines;
  const visibleLines = lines.slice(0, maxLines);

  return (
    <Box flexDirection="column">
      {visibleLines.map((ln, i) => (
        <Text key={i}>{renderLine(ln)}</Text>
      ))}
      {(truncatedByBytes || truncatedByLines) && (
        <Text dimColor>… truncated, open in $EDITOR for full</Text>
      )}
    </Box>
  );
}

function renderLine(line: string): string {
  // Minimal markdown affordances: strip leading `# `, `## `, etc.
  return line.replace(/^#{1,6}\s+/, '');
}
