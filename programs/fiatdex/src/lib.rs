use anchor_lang::prelude::*;

use agnostic_orderbook::state::{Side,SelfTradeBehavior};

use instructions::*;
use types::*;
use program_accounts::*;
use error::*;

mod consts;
mod error;
pub mod program_accounts;
pub mod instructions;
pub mod types;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod fiatdex {
    use super::*;

    pub fn init_market(ctx: Context<InitMarket>, market_id: [u8; 10], min_base_order_size: u64, tick_size: u64) -> Result<()> {
        instructions::init_market(ctx, market_id, min_base_order_size, tick_size)
    }

    pub fn new_maker_order(_ctx: Context<InitMarket>) -> Result<()> {
        let alice = [1; 32];
        let invoke_params = agnostic_orderbook::instruction::new_order::Params {
            max_base_qty: 50_000,
            max_quote_qty: 1_000_000_000,
            limit_price: 15 << 32,
            side: Side::Bid,
            match_limit: 10,
            callback_info: alice,
            post_only: false,
            post_allowed: true,
            self_trade_behavior: SelfTradeBehavior::AbortTransaction,
        };

        Err(error!(CustomErrors::NotImplemented))
        // Ok(())
    }

    pub fn new_taker_order(_ctx: Context<InitMarket>) -> Result<()> {
        Err(error!(CustomErrors::NotImplemented))
        // Ok(())
    }
}
