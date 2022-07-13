import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface NewMakerOrderArgs {
  limitPrice: BN
  maxBaseQty: BN
}

export interface NewMakerOrderAccounts {
  user: PublicKey
  market: PublicKey
  eventQueue: PublicKey
  bids: PublicKey
  asks: PublicKey
  orderbook: PublicKey
  quoteMint: PublicKey
  baseMint: PublicKey
  userQuote: PublicKey
  userBase: PublicKey
  quoteVault: PublicKey
  baseVault: PublicKey
  tokenProgram: PublicKey
}

export const layout = borsh.struct([
  borsh.u64("limitPrice"),
  borsh.u64("maxBaseQty"),
])

export function newMakerOrder(
  args: NewMakerOrderArgs,
  accounts: NewMakerOrderAccounts
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.user, isSigner: true, isWritable: false },
    { pubkey: accounts.market, isSigner: false, isWritable: false },
    { pubkey: accounts.eventQueue, isSigner: false, isWritable: true },
    { pubkey: accounts.bids, isSigner: false, isWritable: true },
    { pubkey: accounts.asks, isSigner: false, isWritable: true },
    { pubkey: accounts.orderbook, isSigner: false, isWritable: true },
    { pubkey: accounts.quoteMint, isSigner: false, isWritable: false },
    { pubkey: accounts.baseMint, isSigner: false, isWritable: false },
    { pubkey: accounts.userQuote, isSigner: false, isWritable: true },
    { pubkey: accounts.userBase, isSigner: false, isWritable: true },
    { pubkey: accounts.quoteVault, isSigner: false, isWritable: true },
    { pubkey: accounts.baseVault, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([147, 105, 46, 226, 95, 150, 181, 24])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      limitPrice: args.limitPrice,
      maxBaseQty: args.maxBaseQty,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
