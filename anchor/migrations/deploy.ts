import { Program, AnchorProvider } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { GuessingGame } from "../target/types/guessing_game";
import { clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";

module.exports = async function (provider: AnchorProvider): Promise<void> {
  try {
    anchor.setProvider(provider);
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    console.log("🚀 Starting deployment process...");

    const program = anchor.workspace.GuessingGame as Program<GuessingGame>;
    console.log(`📦 Program ID: ${program.programId.toString()}`);

    console.log("Wallet: ", provider.wallet.publicKey.toBase58());

    const [stateAccountPda, _] = await PublicKey.findProgramAddressSync(
      [Buffer.from("guess_state")],
      program.programId,
    );
    console.log(`📍 Derived State PDA: ${stateAccountPda.toString()}`);

    const stateAccount = await connection.getAccountInfo(stateAccountPda);

    if (!stateAccount) {
      console.log("🆕 State account not found. Initializing...");

      console.log("🔨 Initializing state...");

      const tx = await program.methods
        .initializeState()
        .accounts({
          authority: provider.wallet.publicKey,
        })
        .instruction();

      console.log("📜 Instruction created");

      const blockhash = await connection.getLatestBlockhash();
      console.log(`🔗 Latest blockhash: ${blockhash.blockhash}`);

      const transaction = new anchor.web3.Transaction({
        feePayer: provider.wallet.publicKey,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(tx);

      console.log("📝 Transaction created");

      await provider.wallet.signTransaction(transaction);

      await provider.sendAndConfirm(transaction, [], {
        commitment: "confirmed",
      });

      console.log("🚀 Transaction sent and confirmed");

      console.log(`✅ State initialized successfully`);
      console.log(`📝 Transaction signature: ${tx}`);
      console.log(`🔑 User: ${provider.wallet.publicKey.toString()}`);
    } else {
      console.log("ℹ️ State account already exists, skipping initialization");
      console.log(`📊 Account size: ${stateAccount.data.length} bytes`);
    }
  } catch (error) {
    console.error("❌ Deployment failed:");
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    } else {
      console.error(`Unknown error: ${error}`);
    }
    throw error;
  }
};
