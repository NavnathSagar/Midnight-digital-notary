import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '..', 'dist');
const managed = path.resolve(__dirname, '..', '..', 'contracts', 'managed', 'digital-notary');

for (const sub of ['keys', 'zkir', 'compiler']) {
  const from = path.join(managed, sub);
  const to = path.join(dist, sub);
  fs.cpSync(from, to, { recursive: true });
  console.log(`Copied ${from} -> ${to}`);
}
