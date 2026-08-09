/**
 * Shared TypeScript glue for the DigitalNotary contract.
 *
 * Mirrors the reference crowdfunding pattern:
 *   - defines the private state shape (secrets that never leave the wallet),
 *   - implements the contract's witness functions,
 *   - exposes the compiled contract wired with those witnesses.
 *
 * The same module is used by the deploy script, the CLI, the unit tests and
 * the browser frontend. It intentionally avoids node-only APIs so it can be
 * bundled by Vite for the web UI.
 */
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

import * as CompiledDigitalNotary from './managed/digital-notary/contract/index.js';
import type { Ledger } from './managed/digital-notary/contract/index.js';

/** A document this wallet has notarized, stored only in private state. */
export interface NotaryDocRecord {
  readonly id: bigint;
  readonly contentHash: Uint8Array;
  readonly nonce: Uint8Array;
  readonly createdAt: string;
}

/** Data staged immediately before `register` so the witnesses can read it. */
export interface PendingRegistration {
  readonly contentHash: Uint8Array;
  readonly nonce: Uint8Array;
}

/**
 * The private state of the DigitalNotary contract. Everything here stays in the
 * user's wallet — the on-chain ledger only ever sees commitments and (after the
 * owner opts in) disclosed fingerprints.
 */
export interface NotaryPrivateState {
  readonly ownerSecret: Uint8Array;
  readonly docs: NotaryDocRecord[];
  readonly pending?: PendingRegistration;
  readonly pendingSealNonce?: Uint8Array;
}

/**
 * 32 random bytes using WebCrypto, safe in both Node and the browser.
 * This is the only randomness source used for all notary secrets.
 */
export const randomBytes32 = (): Uint8Array => {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
};

/** SHA-256 via WebCrypto — computes the document fingerprint in the caller's device. */
export const sha256 = async (data: Uint8Array): Promise<Uint8Array> => {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data as unknown as ArrayBuffer);
  return new Uint8Array(digest);
};

export const createNotaryPrivateState = (ownerSecret: Uint8Array): NotaryPrivateState => ({
  ownerSecret,
  docs: [],
  pending: undefined,
  pendingSealNonce: undefined,
});

export const createOwnerSecret = (): Uint8Array => randomBytes32();

const findDoc = (privateState: NotaryPrivateState, id: bigint): NotaryDocRecord => {
  const record = privateState.docs.find((d) => d.id === id);
  if (!record) {
    throw new Error(`No document recorded with id ${id} in this wallet`);
  }
  return record;
};

export const witnesses = {
  freshContentHash: ({
    privateState,
  }: WitnessContext<Ledger, NotaryPrivateState>): [NotaryPrivateState, Uint8Array] => {
    if (!privateState.pending?.contentHash) {
      throw new Error('No pending content hash — call register() before transacting');
    }
    return [privateState, privateState.pending.contentHash];
  },
  freshDocNonce: ({
    privateState,
  }: WitnessContext<Ledger, NotaryPrivateState>): [NotaryPrivateState, Uint8Array] => {
    if (!privateState.pending?.nonce) {
      throw new Error('No pending document nonce — call register() before transacting');
    }
    return [privateState, privateState.pending.nonce];
  },
  ownerSecret: ({
    privateState,
  }: WitnessContext<Ledger, NotaryPrivateState>): [NotaryPrivateState, Uint8Array] => [
    privateState,
    privateState.ownerSecret,
  ],
  contentSecret: (
    { privateState }: WitnessContext<Ledger, NotaryPrivateState>,
    id: bigint,
  ): [NotaryPrivateState, Uint8Array] => [privateState, findDoc(privateState, id).contentHash],
  docNonce: (
    { privateState }: WitnessContext<Ledger, NotaryPrivateState>,
    id: bigint,
  ): [NotaryPrivateState, Uint8Array] => [privateState, findDoc(privateState, id).nonce],
  sealNonce: ({
    privateState,
  }: WitnessContext<Ledger, NotaryPrivateState>): [NotaryPrivateState, Uint8Array] => {
    if (!privateState.pendingSealNonce) {
      throw new Error('No pending seal nonce — stage one before calling attest()');
    }
    return [privateState, privateState.pendingSealNonce];
  },
};

/**
 * DApp-side helpers that mutate private state around a circuit call.
 * Witnesses are pure readers; these helpers apply the state transitions after a
 * successful transaction, so a failed call leaves no trace.
 */
export const stageRegistration = (
  privateState: NotaryPrivateState,
  contentHash: Uint8Array,
): NotaryPrivateState => ({
  ...privateState,
  pending: { contentHash, nonce: randomBytes32() },
});

export const recordRegistration = (
  privateState: NotaryPrivateState,
  id: bigint,
): NotaryPrivateState => {
  const pending = privateState.pending;
  if (!pending) {
    throw new Error('No pending registration to record');
  }
  return {
    ownerSecret: privateState.ownerSecret,
    docs: [
      ...privateState.docs,
      { id, contentHash: pending.contentHash, nonce: pending.nonce, createdAt: new Date().toISOString() },
    ],
    pending: undefined,
    pendingSealNonce: privateState.pendingSealNonce,
  };
};

export const stageSeal = (privateState: NotaryPrivateState): NotaryPrivateState => ({
  ...privateState,
  pendingSealNonce: randomBytes32(),
});

export const clearSeal = (privateState: NotaryPrivateState): NotaryPrivateState => ({
  ...privateState,
  pendingSealNonce: undefined,
});

export const CompiledDigitalNotaryContract = CompiledContract.make<
  CompiledDigitalNotary.Contract<NotaryPrivateState>
>('DigitalNotary', CompiledDigitalNotary.Contract<NotaryPrivateState>).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('./managed/digital-notary'),
);

export * from './managed/digital-notary/contract/index.js';
