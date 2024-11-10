import { BN, Program } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { GuessProgram } from "../guess_program";
import idl from "@/common/idl/guess_program.json";

export const derivePDA = async (challengeId: number) => {
  const [pda] = await PublicKey.findProgramAddressSync(
    [Buffer.from("guess_challenge"), new BN(challengeId).toBuffer("le", 8), Buffer.alloc(7)],
    new PublicKey(idl.address),
  );
  return pda;
};

export const initGuessProgram = async (): Promise<{
  program: Program<GuessProgram>;
  connection: Connection;
}> => {
  const connection = new Connection(process.env.SOLANA_RPC || clusterApiUrl("devnet"), "confirmed");
  const program: Program<GuessProgram> = new Program(idl as GuessProgram, { connection });
  return { program, connection };
};
