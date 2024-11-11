use anchor_lang::prelude::*;

declare_id!("7Dn7epAr8GzQb7pXtFGCZEygzJBbieBxqxuiWdTeGtbG");

const DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod guessing_game {
    use super::*;

    pub fn initialize_state(ctx: Context<InitializeState>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.current_challenge_id = 0;
        state.authority = ctx.accounts.authority.key();
        msg!("Global state initialized");
        Ok(())
    }

    pub fn initialize(ctx: Context<Initialize>, secret_number: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let pda_account = &mut ctx.accounts.pda_account;
        
        state.current_challenge_id = state.current_challenge_id.checked_add(1)
            .ok_or(ErrorCode::ChallengeIdOverflow)?;
        
        pda_account.challenge_id = state.current_challenge_id;
        pda_account.secret_number = secret_number;
        pda_account.owner = *ctx.accounts.initializer.key;
        pda_account.winner = None;

        msg!("PDA initialized with challenge ID: {:?}", state.current_challenge_id);
        Ok(())
    }

    pub fn guess(ctx: Context<Guess>, guess_number: u64) -> Result<()> {
        let pda_account = &mut ctx.accounts.pda_account;
        
        if pda_account.winner.is_some() {
            msg!("A winner has already been declared.");
            return Err(ErrorCode::WinnerAlreadyDeclared.into());
        }

        if guess_number == pda_account.secret_number {
            pda_account.winner = Some(*ctx.accounts.guesser.key);
            msg!("Correct guess! Winner: {:?}", ctx.accounts.guesser.key);
        } else {
            msg!("Incorrect guess, try again.");
        }

        Ok(())
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        msg!("Closing account for challenge ID: {:?}", ctx.accounts.pda_account.challenge_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeState<'info> {
    #[account(
        init,
        payer = authority,
        space = DISCRIMINATOR_SIZE + StateAccount::INIT_SPACE,
        seeds = [b"guess_state"],
        bump
    )]
    pub state: Account<'info, StateAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"guess_state"],
        bump
    )]
    pub state: Account<'info, StateAccount>,
    #[account(
        init,
        space = DISCRIMINATOR_SIZE + GuessAccount::INIT_SPACE,
        payer = initializer,
        seeds = [
            b"guess_challenge",
            &(state.current_challenge_id.checked_add(1).unwrap()).to_le_bytes()[..],
            &[0; 7]
        ],
        bump,
    )]
    pub pda_account: Account<'info, GuessAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Guess<'info> {
    #[account(
        mut,
        seeds = [b"guess_challenge", 
        &pda_account.challenge_id.to_le_bytes(),
        &[0; 7]
        ],
        bump
    )]
    pub pda_account: Account<'info, GuessAccount>,
    pub guesser: Signer<'info>,
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(
        mut,
        seeds = [
            b"guess_challenge",
            &pda_account.challenge_id.to_le_bytes(),
            &[0; 7]
        ],
        bump,
        close = receiver,
        has_one = owner,
    )]
    pub pda_account: Account<'info, GuessAccount>,
    #[account(mut)]
    pub receiver: SystemAccount<'info>,
    pub owner: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct StateAccount {
    pub current_challenge_id: u64,
    pub authority: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct GuessAccount {
    pub challenge_id: u64,
    pub secret_number: u64,
    pub owner: Pubkey,
    pub winner: Option<Pubkey>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("A winner has already been declared.")]
    WinnerAlreadyDeclared,
    #[msg("Challenge ID overflow")]
    ChallengeIdOverflow,
}