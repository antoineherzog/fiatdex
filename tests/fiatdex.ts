import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { Program, ProgramError } from "@project-serum/anchor";
import { EventQueue, SlabHeader, Slab } from "@bonfida/aaob";
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
  initUser,
  initMarketObj,
  toFp32,
  toFpLimitPrice,
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
  const bidsBytes = 8840;
  const asksBytes = 8840;
  const orderbookBytes = 120;

  let market: Market;
  let users: Array<User> = [];

  console.log("OK!! ");

  let sizeEvent = EventQueue.computeAllocationSize(100, 32); // EventQueue.computeAllocationSize(eventCapacity, callbackInfoLen);

  const slabSize = Slab.computeAllocationSize(100, 32); //Slab.computeAllocationSize(orderCapacity, callbackInfoLen);

  console.log("SizeEVent ", sizeEvent);
  console.log("Ask ", slabSize);


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

  it("inits open order of Bob and Alice", async () => {


    let thisBidUser = await initUser(
      program,
      provider,
      wallet,
      market,
      new genTypes.Side.Bid(),
      new anchor.BN(1_000_000),
      new anchor.BN(0),
    );

    let thisAskUser = await initUser(
      program,
      provider,
      wallet,
      market,
      new genTypes.Side.Ask(),
      new anchor.BN(1_000),
      new anchor.BN(0),
    );

    users.push(thisAskUser, thisBidUser);

    let tx = new anchor.web3.Transaction();

    tx.add(
      genInstr.initOpenOrders(
        { ...thisAskUser },
        { ...thisAskUser, ...auction }
      )
    );
    tx.add(
      genInstr.initOpenOrders(
        { ...thisBidUser },
        { ...thisBidUser, ...auction }
      )
    );
    await provider.send(
      tx,
      [thisAskUser.userKeypair, thisBidUser.userKeypair],
      { skipPreflight: true }
    );

    /*
    

    let askOpenOrders = await genAccs.OpenOrders.fetch(
      provider.connection,
      thisAskUser.openOrders
    );
    let bidOpenOrders = await genAccs.OpenOrders.fetch(
      provider.connection,
      thisBidUser.openOrders
    );
    assert.isTrue(
      askOpenOrders.authority.toString() == thisAskUser.user.toString(),
      "check ask open orders init correctly"
    );
    */

  });
  it("creates a new bid order", async () => {


    let tx1 = new anchor.web3.Transaction();

    //console.log("Display Test---->", { ...thisAskUser, ...market });

    tx1.add(
      genInstr.newOrder(
        {
          side: new genTypes.Side.Bid(),
          limitPrice: toFpLimitPrice(15, tickSizeNum),
          maxBaseQty: new BN(1_000_000),
          isBroker: true,
        },
        { ...users[0], ...market }
      )
    );

    await provider.sendAndConfirm(tx1, [users[0].userKeypair], { skipPreflight: true });
  });

  it("creates a new ask order", async () => {

    let tx2 = new anchor.web3.Transaction();


    tx2.add(
      genInstr.newOrder(
        {
          side: new genTypes.Side.Ask(),
          limitPrice: toFpLimitPrice(10, tickSizeNum),
          maxBaseQty: new BN(1_000),
          isBroker: false,
        },
        { ...users[1], ...market }
      )
    );

    await provider.sendAndConfirm(tx2, [users[1].userKeypair], { skipPreflight: true });
  });
  it("consumes events", async () => {

    let tx3 = new anchor.web3.Transaction();

    let thisInstr = genInstr.consumeOrderEvents(
      {
        maxIterations: new BN(10),
      },
      { ...market }
    );

    // This is how we add remaining accounts to the transaction instruction
    thisInstr.keys = thisInstr.keys.concat([
      { pubkey: users[0].openOrders, isSigner: false, isWritable: true },
      { pubkey: users[1].openOrders, isSigner: false, isWritable: true },
    ]);
    tx3.add(thisInstr);
    await provider.sendAndConfirm(tx3, [], { skipPreflight: true });


  });

});
