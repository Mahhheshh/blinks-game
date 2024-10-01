import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GuessProgram } from "../target/types/guess_program";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("guess_game test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GuessProgram as Program<GuessProgram>;

  let initializer: Keypair;
  let guesser: Keypair;
  let pdaAccount: PublicKey;
  const challengeId = new anchor.BN(1);
  const secretNumber = new anchor.BN(42);

  before(async () => {
    initializer = Keypair.generate();
    guesser = Keypair.generate();

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(initializer.publicKey, 1000000000),
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(guesser.publicKey, 1000000000),
    );

    const seeds = [Buffer.from("guess_challenge"), challengeId.toBuffer("le", 8), Buffer.alloc(7)];

    const [pda] = PublicKey.findProgramAddressSync(seeds, program.programId);
    pdaAccount = pda;

    console.log("Program ID:", program.programId.toBase58());
    console.log("PDA:", pda.toBase58());
    console.log("Initializer:", initializer.publicKey.toBase58());

    await program.methods
      .initialize(challengeId, secretNumber)
      .accounts({
        initializer: initializer.publicKey,
        pdaAccount: pdaAccount,
      })
      .signers([initializer])
      .rpc();
  });

  it("should initialize the PDA account", async () => {
    const pdaAccountState = await program.account.guessAccount.fetch(pdaAccount);

    assert.equal(pdaAccountState.challengeId.toString(), challengeId.toString());
    assert.equal(pdaAccountState.secretNumber.toString(), secretNumber.toString());
    assert.equal(pdaAccountState.owner.toBase58(), initializer.publicKey.toBase58());
    assert.equal(pdaAccountState.winner, null);
  });

  it("should not accept incorrect gueeses", async () => {
    await program.methods
      .guess(new anchor.BN(40))
      .accounts({
        pdaAccount: pdaAccount,
        guesser: guesser.publicKey,
      })
      .signers([guesser])
      .rpc();

    const pdaAccountState = await program.account.guessAccount.fetch(pdaAccount);
    assert.equal(pdaAccountState.winner, null);
  });

  it("should allow a correct guess", async () => {
    await program.methods
      .guess(new anchor.BN(42))
      .accounts({
        pdaAccount: pdaAccount,
        guesser: guesser.publicKey,
      })
      .signers([guesser])
      .rpc();

    const pdaAccountState = await program.account.guessAccount.fetch(pdaAccount);
    assert.equal(pdaAccountState.winner.toBase58(), guesser.publicKey.toBase58());
  });

  it("should not allow a guess after a winner has been declared", async () => {
    try {
      await program.methods
        .guess(new anchor.BN(100))
        .accounts({
          pdaAccount: pdaAccount,
          guesser: guesser.publicKey,
        })
        .signers([guesser])
        .rpc();

      assert.fail("Expected error not thrown");
    } catch (err) {
      assert.include(err.toString(), "A winner has already been declared");
    }
  });
});
