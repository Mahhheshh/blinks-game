use anchor_lang::prelude::*;

declare_id!("52FBC8SyRo1ZoE5vFY7qcu3EePgKeLRhquxcGeetUCL");

const DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod guess_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, challenge_id: u64, secret_number: u64) -> Result<()> {
        let pda_account = &mut ctx.accounts.pda_account;
        
        pda_account.challenge_id = challenge_id;
        pda_account.secret_number = secret_number;
        pda_account.owner = *ctx.accounts.initializer.key;
        pda_account.winner = None;

        msg!("PDA initialized with challenge ID: {:?}", challenge_id);
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
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
        init,
        space = DISCRIMINATOR_SIZE + GuessAccount::INIT_SPACE,
        payer = initializer,
        seeds = [
            b"guess_challenge",
            &challenge_id.to_le_bytes()[..],
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
}
