import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface OpenOrdersFields {
  bump: number
  authority: PublicKey
  isBidsAccount: boolean
  publicKey: Uint8Array
  encryptedOrders: Array<types.EncryptedOrderFields>
  quoteTokenLocked: BN
  quoteTokenFree: BN
  baseTokenLocked: BN
  baseTokenFree: BN
  numOrders: number
  orders: Array<BN>
}

export interface OpenOrdersJSON {
  bump: number
  authority: string
  isBidsAccount: boolean
  publicKey: Array<number>
  encryptedOrders: Array<types.EncryptedOrderJSON>
  quoteTokenLocked: string
  quoteTokenFree: string
  baseTokenLocked: string
  baseTokenFree: string
  numOrders: number
  orders: Array<string>
}

export class OpenOrders {
  readonly bump: number
  readonly authority: PublicKey
  readonly isBidsAccount: boolean
  readonly publicKey: Uint8Array
  readonly encryptedOrders: Array<types.EncryptedOrder>
  readonly quoteTokenLocked: BN
  readonly quoteTokenFree: BN
  readonly baseTokenLocked: BN
  readonly baseTokenFree: BN
  readonly numOrders: number
  readonly orders: Array<BN>

  static readonly discriminator = Buffer.from([
    139, 166, 123, 206, 111, 2, 116, 33,
  ])

  static readonly layout = borsh.struct([
    borsh.u8("bump"),
    borsh.publicKey("authority"),
    borsh.bool("isBidsAccount"),
    borsh.vecU8("publicKey"),
    borsh.vec(types.EncryptedOrder.layout(), "encryptedOrders"),
    borsh.u64("quoteTokenLocked"),
    borsh.u64("quoteTokenFree"),
    borsh.u64("baseTokenLocked"),
    borsh.u64("baseTokenFree"),
    borsh.u8("numOrders"),
    borsh.vec(borsh.u128(), "orders"),
  ])

  constructor(fields: OpenOrdersFields) {
    this.bump = fields.bump
    this.authority = fields.authority
    this.isBidsAccount = fields.isBidsAccount
    this.publicKey = fields.publicKey
    this.encryptedOrders = fields.encryptedOrders.map(
      (item) => new types.EncryptedOrder({ ...item })
    )
    this.quoteTokenLocked = fields.quoteTokenLocked
    this.quoteTokenFree = fields.quoteTokenFree
    this.baseTokenLocked = fields.baseTokenLocked
    this.baseTokenFree = fields.baseTokenFree
    this.numOrders = fields.numOrders
    this.orders = fields.orders
  }

  static async fetch(
    c: Connection,
    address: PublicKey
  ): Promise<OpenOrders | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(PROGRAM_ID)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[]
  ): Promise<Array<OpenOrders | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(PROGRAM_ID)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): OpenOrders {
    if (!data.slice(0, 8).equals(OpenOrders.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = OpenOrders.layout.decode(data.slice(8))

    return new OpenOrders({
      bump: dec.bump,
      authority: dec.authority,
      isBidsAccount: dec.isBidsAccount,
      publicKey: new Uint8Array(
        dec.publicKey.buffer,
        dec.publicKey.byteOffset,
        dec.publicKey.length
      ),
      encryptedOrders: dec.encryptedOrders.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.EncryptedOrder.fromDecoded(item)
      ),
      quoteTokenLocked: dec.quoteTokenLocked,
      quoteTokenFree: dec.quoteTokenFree,
      baseTokenLocked: dec.baseTokenLocked,
      baseTokenFree: dec.baseTokenFree,
      numOrders: dec.numOrders,
      orders: dec.orders,
    })
  }

  toJSON(): OpenOrdersJSON {
    return {
      bump: this.bump,
      authority: this.authority.toString(),
      isBidsAccount: this.isBidsAccount,
      publicKey: Array.from(this.publicKey.values()),
      encryptedOrders: this.encryptedOrders.map((item) => item.toJSON()),
      quoteTokenLocked: this.quoteTokenLocked.toString(),
      quoteTokenFree: this.quoteTokenFree.toString(),
      baseTokenLocked: this.baseTokenLocked.toString(),
      baseTokenFree: this.baseTokenFree.toString(),
      numOrders: this.numOrders,
      orders: this.orders.map((item) => item.toString()),
    }
  }

  static fromJSON(obj: OpenOrdersJSON): OpenOrders {
    return new OpenOrders({
      bump: obj.bump,
      authority: new PublicKey(obj.authority),
      isBidsAccount: obj.isBidsAccount,
      publicKey: Uint8Array.from(obj.publicKey),
      encryptedOrders: obj.encryptedOrders.map((item) =>
        types.EncryptedOrder.fromJSON(item)
      ),
      quoteTokenLocked: new BN(obj.quoteTokenLocked),
      quoteTokenFree: new BN(obj.quoteTokenFree),
      baseTokenLocked: new BN(obj.baseTokenLocked),
      baseTokenFree: new BN(obj.baseTokenFree),
      numOrders: obj.numOrders,
      orders: obj.orders.map((item) => new BN(item)),
    })
  }
}