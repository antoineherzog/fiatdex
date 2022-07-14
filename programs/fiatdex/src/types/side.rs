use agnostic_orderbook::state::Side as AobSide;
use anchor_lang::prelude::*;

use std::fmt::Display;
use std::fmt::Formatter;
use std::fmt::Result;
use std::fmt;


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum Side {
    Bid,
    Ask,
}

impl From<Side> for AobSide {
    fn from(side: Side) -> AobSide {
        match side {
            Side::Bid => AobSide::Bid,
            Side::Ask => AobSide::Ask,
        }
    }
}

impl Default for Side {
    fn default() -> Self {
        Side::Bid
    }
}

impl fmt::Display for Side {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Side::Bid => {
                write!(f, "Side::Bid")
            }
            Side::Ask => {
                write!(f, "Side::Ask")
            }
        }
    }
}