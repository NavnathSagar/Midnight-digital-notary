import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum DocStatus { registered = 0, disclosed = 1, revoked = 2 }

export type Witnesses<PS> = {
  freshContentHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  freshDocNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  ownerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  contentSecret(context: __compactRuntime.WitnessContext<Ledger, PS>,
                id_0: bigint): [PS, Uint8Array];
  docNonce(context: __compactRuntime.WitnessContext<Ledger, PS>, id_0: bigint): [PS, Uint8Array];
  sealNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
  discloseDocument(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  attest(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
  discloseDocument(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  attest(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  register(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, bigint>;
  discloseDocument(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  attest(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, id_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly documentCount: bigint;
  docCommitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  ownerCommitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  statuses: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): DocStatus;
    [Symbol.iterator](): Iterator<[bigint, DocStatus]>
  };
  publicFingerprints: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  witnessSeals: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
