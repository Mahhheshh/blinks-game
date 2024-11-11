import { BN, Program } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { GuessingGame } from "../guessing_game";
import idl from "@/common/idl/guessing_game.json";

export const deriveChallangePda = async (program: Program<GuessingGame>) => {
  const [stateAccountPda, _] = await PublicKey.findProgramAddressSync(
    [Buffer.from("guess_state")],
    new PublicKey(idl.address),
  );

  const stateAccount = await program.account.stateAccount.fetch(stateAccountPda);

  const [pda] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("guess_challenge"),
      new BN(await stateAccount.currentChallengeId).toBuffer("le", 8),
      Buffer.alloc(7),
    ],
    new PublicKey(idl.address),
  );
  return { stateAccount, pdaAccount: pda };
};

export const deriveGuessPdaById = async (
  challangeId: string,
): Promise<{ pdaAccount: PublicKey }> => {
  const [pdaAccount, _] = await PublicKey.findProgramAddressSync(
    [Buffer.from("guess_challenge"), new BN(challangeId).toBuffer("le", 8), Buffer.alloc(7)],
    new PublicKey(idl.address),
  );
  return { pdaAccount };
};

export const initGuessingGame = async (): Promise<{
  program: Program<GuessingGame>;
  connection: Connection;
}> => {
  const connection = new Connection(process.env.SOLANA_RPC || clusterApiUrl("devnet"), "confirmed");
  const program: Program<GuessingGame> = new Program(idl as GuessingGame, { connection });
  return { program, connection };
};

export const getIconUrl = async (): Promise<string> => {
  const baseUrl =
    process.env.ENV === "prod" ? "https://blinks-game.onrender.com" : "http://localhost:3000";

  return new URL("/guess-game-icon.png", baseUrl).toString();
};
