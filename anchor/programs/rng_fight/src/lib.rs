use anchor_lang::prelude::*;

declare_id!("Fe4xbkhVRRCiJxPN2n9rZWJkfdiJj1D9mifGMWE36Ao8");

#[program]
pub mod rng_fight {
    use super::*;

    pub fn initialize_game_account(_ctx: Context<InitializeGameAccount>) -> Result<()> {
        Ok(())
    }

    pub fn create_challenge(ctx: Context<CreateChallengeContext>, challenge_id: u64) -> Result<()> {
        let challenger = &ctx.accounts.challenger;
        let challenge_account = &mut ctx.accounts.challenge_account;
    
        let challenge = Challenge {
            challenge_id,
            challenger: challenger.key(),
            defender: None,
            challenger_health: 100,
            defender_health: 100,
            current_turn: challenger.key(),
            state: State::InvitationSent,
            challenger_last_choice: Action::None,
            defender_last_choice: Action::None
        };
    
        challenge_account.challenges.push(challenge);

        Ok(())
    }

    pub fn accept_challenge(ctx: Context<AcceptChallengeAccount>, challenge_id: u64) -> Result<()> {
        let defender = &ctx.accounts.defender;
        let challenge_account = &mut ctx.accounts.challenge_account;
    
        if let Some(challenge) = challenge_account
            .challenges
            .iter_mut()
            .find(|ch| ch.challenge_id == challenge_id)
        {
            if challenge.challenger == defender.key() {
                return Err(ErrorCodes::InvalidAction.into());
            }
            challenge.defender = Some(defender.key());
            challenge.state = State::Started;
            Ok(())
        } else {
            Err(ErrorCodes::ChallengeNotFound.into())
        }
    }

    pub fn attack(ctx: Context<AttackAccount>, challenge_id: u64, damage: i8) -> Result<()> {
        let attacker = &ctx.accounts.attacker;
        let challenge_account = &mut ctx.accounts.challenge_account;
    
        if let Some(challenge) = challenge_account
            .challenges
            .iter_mut()
            .find(|ch| ch.challenge_id == challenge_id)
        {
            if challenge.current_turn != attacker.key() {
                return Err(ErrorCodes::NotYourTurn.into());
            }
        
            if damage > 0 {
                if challenge.current_turn == challenge.challenger {
                    if challenge.defender_last_choice != Action::Defend {
                        challenge.defender_health = challenge.defender_health.saturating_sub(damage as u8);
                    }
                } else {
                    if challenge.challenger_last_choice != Action::Defend {
                        challenge.challenger_health = challenge.challenger_health.saturating_sub(damage as u8);
                    }
                }
            } else {
                if challenge.current_turn == challenge.challenger {
                    if challenge.challenger_last_choice != Action::Defend {
                        challenge.challenger_health = challenge.challenger_health.saturating_sub((-damage) as u8);
                    }
                } else {
                    if challenge.defender_last_choice != Action::Defend {
                        challenge.defender_health = challenge.defender_health.saturating_sub((-damage) as u8);
                    }
                }
            }
        
            if challenge.challenger_health == 0 || challenge.defender_health == 0 {
                challenge.state = State::Ended;
            } else {
                challenge.current_turn = if challenge.current_turn == challenge.challenger {
                    challenge.defender.unwrap_or(challenge.challenger)
                } else {
                    challenge.challenger
                };
            }
        
            Ok(())
        } else {
            Err(ErrorCodes::ChallengeNotFound.into())
        }
    }
}

#[derive(Accounts)]
pub struct InitializeGameAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + ChallengeAccount::INIT_SPACE,
        seeds = [b"challenges".as_ref()],
        bump
    )]
    pub challenge_account: Account<'info, ChallengeAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateChallengeContext<'info> {
    #[account(mut)]
    pub challenger: Signer<'info>,

    #[account(
        mut,
        seeds = [b"challenges".as_ref()],
        bump
    )]
    pub challenge_account: Account<'info, ChallengeAccount>
}

#[derive(Accounts)]
pub struct AcceptChallengeAccount<'info> {
    #[account(mut)]
    pub defender: Signer<'info>,

    #[account(
        mut,
        seeds = [b"challenges".as_ref()],
        bump
    )]
    pub challenge_account: Account<'info, ChallengeAccount>
}

#[derive(Accounts)]
pub struct AttackAccount<'info> {
    #[account(mut)]
    pub attacker: Signer<'info>,

    #[account(
        mut,
        seeds = [b"challenges".as_ref()],
        bump
    )]
    pub challenge_account: Account<'info, ChallengeAccount>
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
#[derive(InitSpace)]
pub struct Challenge {
    pub challenge_id: u64,
    pub challenger: Pubkey,
    pub defender: Option<Pubkey>,
    pub challenger_health: u8,
    pub defender_health: u8,
    pub current_turn: Pubkey,
    pub challenger_last_choice: Action,
    pub defender_last_choice: Action,
    pub state: State,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
#[derive(InitSpace)]
pub enum Action {
    Kick,
    Punch,
    Defend,
    None,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
#[derive(InitSpace)]
pub enum State {
    InvitationSent,
    Started,
    Ended,
    Going,
}

#[account]
#[derive(InitSpace)]
pub struct ChallengeAccount {
    #[max_len(50)]
    pub challenges: Vec<Challenge>,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCodes {
    #[msg("Challenge Not Found!")]
    ChallengeNotFound,
    #[msg("Invalid Action!")]
    InvalidAction,
    #[msg("Not Your Turn!")]
    NotYourTurn,
}
