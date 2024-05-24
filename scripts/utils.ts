import { existsSync, readFileSync, writeFileSync } from 'fs';


export function formatBytes32String(bytes20String: string) {
  const bytes32String =
    '0x' + '0'.repeat(24) + bytes20String.substring(2, bytes20String.length);
  return bytes32String;
}

export function updateDeploymentFile(networkName: string, newEntries: object) {
  const filePath = `./deployments/${networkName}.json`;
  let data = {};

  // Check if the file exists
  if (existsSync(filePath)) {
    // Read the current contents of the file
    const fileContents = readFileSync(filePath, 'utf-8');
    data = JSON.parse(fileContents);
  }

  // Merge the new entries with the existing data
  const updatedData = { ...data, ...newEntries };

  // Write the merged data back to the file
  writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
}
