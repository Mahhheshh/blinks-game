import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GuessingGame } from "../target/types/guessing_game";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("guess_game test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GuessingGame as Program<GuessingGame>;

  let authority: Keypair;
  let initializer: Keypair;
  let guesser: Keypair;
  let stateAccount: PublicKey;
  let pdaAccount: PublicKey;
  const secretNumber = new anchor.BN(42);

  before(async () => {
    authority = Keypair.generate();
    initializer = Keypair.generate();
    guesser = Keypair.generate();

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, LAMPORTS_PER_SOL),
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(initializer.publicKey, LAMPORTS_PER_SOL),
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(guesser.publicKey, LAMPORTS_PER_SOL),
    );

    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("guess_state")],
      program.programId,
    );
    stateAccount = statePda;

    await program.methods
      .initializeState()
      .accounts({
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    const stateAccountState = await program.account.stateAccount.fetch(stateAccount);
    const [gamePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("guess_challenge"),
        stateAccountState.currentChallengeId.toBuffer("le", 8),
        Buffer.alloc(7),
      ],
      program.programId,
    );
    pdaAccount = gamePda;

    console.log("Program ID:", program.programId.toBase58());
    console.log("State PDA:", stateAccount.toBase58());
    console.log("Game PDA:", pdaAccount.toBase58());
    console.log("Authority:", authority.publicKey.toBase58());
    console.log("Initializer:", initializer.publicKey.toBase58());

    // Initialize the first game
    await program.methods
      .initialize(secretNumber)
      .accounts({
        initializer: initializer.publicKey,
        pdaAccount: pdaAccount,
      })
      .signers([initializer])
      .rpc();
  });

  it("should initialize the state account", async () => {
    const stateAccountState = await program.account.stateAccount.fetch(stateAccount);
    assert.equal(stateAccountState.currentChallengeId.toString(), "2");
    assert.equal(stateAccountState.authority.toBase58(), authority.publicKey.toBase58());
  });

  it("should initialize the game PDA account", async () => {
    const pdaAccountState = await program.account.guessAccount.fetch(pdaAccount);

    assert.equal(pdaAccountState.challengeId.toString(), "1");
    assert.equal(pdaAccountState.secretNumber.toString(), secretNumber.toString());
    assert.equal(pdaAccountState.owner.toBase58(), initializer.publicKey.toBase58());
    assert.equal(pdaAccountState.winner, null);
  });

  it("should create multiple games with incrementing challenge IDs", async () => {
    const [secondGamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("guess_challenge"), new anchor.BN(2).toBuffer("le", 8), Buffer.alloc(7)],
      program.programId,
    );

    await program.methods
      .initialize(new anchor.BN(100))
      .accounts({
        initializer: initializer.publicKey,
        pdaAccount: secondGamePda,
      })
      .signers([initializer])
      .rpc();

    const secondGameState = await program.account.guessAccount.fetch(secondGamePda);
    assert.equal(secondGameState.challengeId.toString(), "2");

    const stateAccountState = await program.account.stateAccount.fetch(stateAccount);
    assert.equal(stateAccountState.currentChallengeId.toString(), "3");
  });

  it("should not accept incorrect guesses", async () => {
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

  it("should allow owner to close the account", async () => {
    const accountInfo = await provider.connection.getAccountInfo(pdaAccount);
    const balanceBefore = accountInfo?.lamports || 0;
    const initializerBalanceBefore = await provider.connection.getBalance(initializer.publicKey);

    await program.methods
      .close()
      .accounts({
        pdaAccount: pdaAccount,
        receiver: initializer.publicKey,
        owner: initializer.publicKey,
      })
      .signers([initializer])
      .rpc();

    const closedAccountInfo = await provider.connection.getAccountInfo(pdaAccount);
    assert.isNull(closedAccountInfo, "Account should be closed");

    const initializerBalanceAfter = await provider.connection.getBalance(initializer.publicKey);
    assert.approximately(
      initializerBalanceAfter - initializerBalanceBefore,
      balanceBefore,
      1000000,
      "Rent should be returned to receiver",
    );
  });
});