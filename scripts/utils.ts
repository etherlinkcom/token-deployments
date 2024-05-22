export function formatBytes32String(bytes20String: string) {
  const bytes32String =
    '0x' + '0'.repeat(24) + bytes20String.substring(2, bytes20String.length);
  return bytes32String;
}