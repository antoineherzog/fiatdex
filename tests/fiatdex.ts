import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { Program, ProgramError } from "@project-serum/anchor";
import {
  createAssociatedTokenAccount,
  createMint,
  createMintToCheckedInstruction,
  getAccount,
  getMint,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Fiatdex } from "../target/types/fiatdex";
import {
  PublicKey,
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import {
  Market,
  User,
  initMarketObj,
  toFp32,
  getCreateAccountParams
} from "./sdk";

import * as genInstr from "../generated/instructions";
import * as genTypes from "../generated/types";
import * as genAccs from "../generated/accounts";
import { fromCode } from "../generated/errors";

import { assert, expect } from "chai";

describe("fiatdex", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();

  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Fiatdex as Program<Fiatdex>;


  const marketId = Array.from(Buffer.from("123".padEnd(10))); // Can be up to 10 characters long
  const minBaseOrderSize = new BN(1000);
  const tickSizeNum = 0.1;
  const tickSize = toFp32(tickSizeNum);
  const eventQueueBytes = 104032;
  const bidsBytes = 104032;
  const asksBytes = 104032;
  const orderbookBytes = 120;

  let market: Market;
  let users: Array<User> = [];


  it("inits the market", async () => {

    market = await initMarketObj(
      program,
      provider,
      wallet,
      marketId,
      minBaseOrderSize,
      tickSize,
    );
    let tx = new anchor.web3.Transaction();

    let eventQueueParams = await getCreateAccountParams(
      program,
      provider,
      wallet,
      market.eventQueue,
      eventQueueBytes
    );
    tx.add(anchor.web3.SystemProgram.createAccount(eventQueueParams));

    let bidsParams = await getCreateAccountParams(
      program,
      provider,
      wallet,
      market.bids,
      bidsBytes
    );
    tx.add(anchor.web3.SystemProgram.createAccount(bidsParams));
    let asksParams = await getCreateAccountParams(
      program,
      provider,
      wallet,
      market.asks,
      asksBytes
    );
    tx.add(anchor.web3.SystemProgram.createAccount(asksParams));

    let orderbookParams = await getCreateAccountParams(
      program,
      provider,
      wallet,
      market.orderbook,
      orderbookBytes
    );
    tx.add(anchor.web3.SystemProgram.createAccount(orderbookParams));

    tx.add(genInstr.initMarket({ ...market }, { ...market }));
    console.log("TEST");
    await provider.sendAndConfirm(
      tx,
      [market.eventQueueKeypair, market.bidsKeypair, market.asksKeypair, market.orderbookKeypair],
      { skipPreflight: true }
    );



    let thisMarket = await genAccs.Market.fetch(
      provider.connection,
      market.market
    );

    assert.isTrue(
      thisMarket.marketId.toString() == marketId.toString(),
      "market Ids match"
    );




    //const tx = await program.methods.initMarket().rpc();
    // console.log("Your transaction signature", tx);
    console.log("Ca tourne");
  });

  it("create maker order", async () => {
    let thisAskUser = await initUser(
      program,
      provider,
      wallet,
      market,
      new genTypes.Side.Ask(),
      new anchor.BN(3_000_000),
      new anchor.BN(0),
    );
    /*
    let tx = new anchor.web3.Transaction();
    tx.add(
      genInstr.newOrder(
        {
          limitPrice: toFpLimitPrice(0.9, tickSizeNum),
          maxBaseQty: new BN(1_000_000),
        },
        { ...thisAskUser, ...auction }
      )
    );

    await provider.send(tx, [thisAskUser.userKeypair], { skipPreflight: true });

    let thisOpenOrders = await genAccs.OpenOrders.fetch(
      provider.connection,
      thisAskUser.openOrders
    );
    assert.isTrue(
      thisOpenOrders.numOrders == 2,
      "check both orders have been placed"
    );

    console.log("The end");
    */
  });

});
