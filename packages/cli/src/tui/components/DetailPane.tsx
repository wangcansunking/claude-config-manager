import { Box, Text } from 'ink';

export interface DetailField { label: string; value: string }

export function DetailPane({
  title, fields, children,
}: {
  title?: string;
  fields?: DetailField[];
  children?: React.ReactNode;
}) {
  return (
    <Box borderStyle="single" borderColor="gray" flexDirection="column" padding={1}>
      {title ? <Text bold>{title}</Text> : null}
      {fields?.map((f) => (
        <Box key={f.label}>
          <Text dimColor>{f.label.padEnd(14)} </Text>
          <Text>{f.value}</Text>
        </Box>
      ))}
      {children}
    </Box>
  );
}
