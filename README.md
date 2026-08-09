# Midnight Digital Notary

A privacy-preserving digital notary dApp built on the [Midnight Network](https://midnight.network) using Compact. Documents are registered as cryptographic commitments, timestamped on-chain, and can later be disclosed by fingerprint or revoked by the owner — without ever revealing the document contents on-chain.

The project ships a Node CLI (`src/cli.ts`) for contract lifecycle operations and a React web app (`frontend/`) for end users backed by the Midnight DApp Connector wallet.

## Project Vision

Traditional notarization forces a party to hand over the full contents of a document to a notary to prove when it existed and who signed it. That over-reveals: the world learns the content, the signer's identity, or both, even when the only thing that matters is *"this document existed at this time and this party stood behind it."*

Midnight Digital Notary flips that model. The document never leaves the client. Only a cryptographic commitment is written to the ledger, along with an anonymous owner commitment — so the chain proves a document was notarized, in what order, and by *a* registrant, but not *which* document or *who* registered it. Nothing is revealed unless the owner deliberately opts in.

Privacy is the product, not an afterthought: an on-chain observer can count notarized documents and see their status lifecycle, but cannot read a single byte of document content, cannot link a record to a file, and cannot identify the registrant or the witness. Midnight's zero-knowledge circuits make this auditable while provably private.

## Smart Contract Deployment

- **Network:** Preview
- **Deployed contract ID:** `6dfc3ee56bd2381488674f41d4dab9a71bcfdb1714446b8ec90d5f4b9283f9ee`

To redeploy, fund the wallet at the [Preview faucet](https://faucet.preview.midnight.network) if needed, then run:

```bash
npm run deploy -- --network preview
```

## Key Features

- **Privacy-preserving registration** — only a SHA-256 commitment of the document (hidden behind a Pedersen commitment plus nonce) is stored on-chain; the document itself never leaves the client. *Proved without revealing your input.*
- **Public verification** — anyone can verify a document is registered, disclosed, or revoked given its content hash, using the public indexer.
- **Disclosure by fingerprint** — the owner reveals only the document fingerprint (an opt-in act), proving the committed content to third parties without exposing the full document or the private nonce.
- **Revocation** — the owner can revoke a previously registered document using their private owner secret.
- **Witness attestation** — an independent witness seals a disclosed fingerprint with an anonymous Pedersen commitment, adding third-party corroboration without revealing the witness's identity.
- **Frontend** — React + Vite app with the Midnight DApp Connector wallet on Preview, live contract state via the public indexer, and loading/error states during proof generation.

## Future Scope

- **Encrypted metadata** — store optional encrypted metadata (title, signer name) alongside the commitment so records are discoverable without sacrificing privacy.
- **Multi-party signing** — multiple owners jointly control a document via threshold circuits instead of a single owner secret.
- **Verifiable timestamps** — integrate the block number/transaction ID into the certificate as a tamper-evident notarization timestamp.
- **Mainnet path** — port the contract to the Midnight mainnet when public networking stabilizes, plus a hosted frontend with real funding.
- **New circuits** — copy-of-record attestations, ownership transfer, and batch notarization to amortize proof cost.

## Tech Stack

- **Language:** Compact (Midnight smart-contract language), TypeScript
- **Zero-knowledge:** Midnight ZKIR circuits compiled from Compact, proving private witnesses never leave the wallet
- **Tooling:** `compact` compiler, midnight.js providers (indexer public-data, level private-state, HTTP proof, ZK config)
- **CLI:** Node.js + tsx, vitest for the test suites
- **Frontend:** React 19 + Vite 8 + TypeScript, DApp Connector API (`@midnight-ntwrk/dapp-connector-api`), fp-ts, RxJS
- **Local devnet:** Docker Compose (Midnight node `:9944`, indexer `:8088`, proof-server `:6300`)
- **Hosting:** Netlify / Vercel SPA config bundled in `frontend/`

## Local Development

### Prerequisites

- **Node.js** `>= 24.11.1` (pinned in `package.json`)
- **Docker** with Compose v2 (for the local devnet / proof server)
- **Compact compiler** CLI (global binary) — required only for `npm run compile`

### Setup, run, test

```bash
npm install            # root deps (CLI + tooling)
npm run setup          # devnet up, compile, deploy to local devnet (network: undeployed)
npm run cli            # interactive CLI against the deployed contract
```

`npm run setup` on `preview` / `preprod` brings up only the proof-server service and prints the faucet URL for funding the wallet:

```bash
npm run setup -- --network preview
```

### Frontend

```bash
npm run frontend:install
npm run frontend:dev        # http://localhost:5173
```

The frontend reads its configuration from `frontend/.env.local` (copy `frontend/.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_NETWORK` | `preview` | Network the wallet must be connected to |
| `VITE_CONTRACT_ADDRESS` | `6dfc3ee56bd2381488674f41d4dab9a71bcfdb1714446b8ec90d5f4b9283f9ee` | Deployed DigitalNotary contract address |
| `VITE_INDEXER_URL` | preview public indexer | GraphQL endpoint for live contract state |
| `VITE_INDEXER_WS_URL` | preview public indexer WS | WebSocket endpoint for live contract state |

### Testing

Two independent suites:

```bash
npm test               # root: contract simulator, glue, network, wallet-state (46 tests)
npm --prefix frontend run test   # frontend: verify logic, private-state provider, components (26 tests)
npm --prefix frontend run typecheck
```

### Building for production

```bash
npm run frontend:build        # vite build + copies ZK assets into dist/
npm --prefix frontend run preview   # serve the built app locally
```

The frontend build is fully standalone: a fresh `npm ci && npm run build` in `frontend/` produces a deployable `dist/` with no other install step.

### Networks

| Network | When to use | Compose services |
| --- | --- | --- |
| `undeployed` | Local devnet (default) | `node`, `indexer`, `proof-server` |
| `preview` | Public preview testnet | `proof-server` |
| `preprod` | Public preprod testnet | `proof-server` |

The active network is sticky (stored in `.midnight-state.json`). Switch with `npm run network <name>`.

`npm run smoke` reads live ledger state from the deployed Preview contract (see `scripts/smoke-read-state.ts`).

### Wallet / funding

- `undeployed` uses a hardcoded genesis seed; the local devnet pre-funds it.
- `preview` / `preprod` generate a fresh seed on first use, stored in `.midnight-state.json` (gitignored). Backup the `seed` value if you fund a public-network wallet you care about.

### Deployment (Netlify / Vercel)

Deploy configs are bundled in `frontend/`:

- `frontend/netlify.toml` — build `npm run build`, publish `dist/`, SPA redirects
- `frontend/vercel.json` — `buildCommand: npm run build`, `outputDirectory: dist`, SPA rewrites
- `frontend/public/_redirects` — SPA fallback for static hosting

On both platforms set the build root to `frontend/` and configure `VITE_CONTRACT_ADDRESS` (and optionally `VITE_NETWORK`, `VITE_INDEXER_URL`, `VITE_INDEXER_WS_URL`) as environment variables.

## License

MIT
