import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { assert } from "chai";
import { RngFight } from "../target/types/rng_fight";

describe("rng_fight starting", () => {
  // Set up the provider to simulate the Solana cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RngFight as Program<RngFight>;

  const AUTHORITY = new anchor.web3.Keypair();

  let challengeAccount: anchor.web3.PublicKey;
  let challenger: anchor.web3.Keypair;
  let defender: anchor.web3.Keypair;

  let challengeId: anchor.BN = new anchor.BN(1);
  before(async () => {
    console.log("🚀 Starting the setup...");

    challenger = anchor.web3.Keypair.generate();
    defender = anchor.web3.Keypair.generate();
    console.log("🔑 Challenger and Defender keypairs generated.");

    // request airdrop
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    const airdropTx = await provider.connection.requestAirdrop(
      AUTHORITY.publicKey,
      web3.LAMPORTS_PER_SOL,
    );

    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropTx,
    });

    const [ChallangeAccountAddress, _] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("challenges")],
      program.programId,
    );
    challengeAccount = ChallangeAccountAddress;
    console.log("📬 Derived challenge account public key:", challengeAccount.toString());

    await program.methods
      .initializeGameAccount()
      .accounts({
        signer: AUTHORITY.publicKey,
      })
      .signers([AUTHORITY])
      .rpc();
    console.log("🎮 Game account initialized.");

    const account = await program.account.challengeAccount.fetch(challengeAccount);
    assert.isNotNull(account, "Challenge account should be initialized.");
    console.log("✅ Challenge account fetched and verified.");
  });

  it("Creates a new challenge", async () => {
    const tx = await program.methods
      .createChallenge(challengeId)
      .accounts({
        challenger: challenger.publicKey,
      })
      .signers([challenger])
      .rpc();
    const account = await program.account.challengeAccount.fetch(challengeAccount);
    assert.equal(account.challenges.length, 1, "Challenge should be created.");
    assert.equal(
      account.challenges[0].challenger.toString(),
      challenger.publicKey.toString(),
      "Challenger should be set.",
    );
    assert.isNotNull(account.challenges[0].state.invitationSent, "Challenge state should be 'InvitationSent'.");
  });

  it("Accepts a challenge", async () => {
    const tx = await program.methods
      .acceptChallenge(challengeId)
      .accounts({
        defender: defender.publicKey,
      })
      .signers([defender])
      .rpc();

    const account = await program.account.challengeAccount.fetch(challengeAccount);
    const challenge = account.challenges.find(
      (ch) => ch.challengeId.toString() === challengeId.toString(),
    );
    assert.equal(
      challenge?.defender.toString(),
      defender.publicKey.toString(),
      "Defender should be set.",
    );
    assert.isNotNull(challenge?.state.started, "Challenge state should be 'Started'.");
  });

  it("Performs an attack", async () => {
    const damage = new anchor.BN(10);
    const tx = await program.methods
      .attack(challengeId, damage)
      .accounts({
        attacker: challenger.publicKey,
      })
      .signers([challenger])
      .rpc();

    const account = await program.account.challengeAccount.fetch(challengeAccount);
    const challenge = account.challenges.find(
      (ch) => ch.challengeId.toString() === challengeId.toString(),
    );
    assert.equal(challenge?.defenderHealth, 90, "Defender's health should decrease by 10.");
  });

  it("Handles negative damage", async () => {
    const damage = new anchor.BN(-10);
    const tx = await program.methods
      .attack(challengeId, damage)
      .accounts({
        attacker: defender.publicKey,
      })
      .signers([defender])
      .rpc();

    const account = await program.account.challengeAccount.fetch(challengeAccount);
    const challenge = account.challenges.find(
      (ch) => ch.challengeId.toString() === challengeId.toString(),
    );
    assert.equal(challenge?.defenderHealth, 80, "Challenger's health should decrease by 10.");
  });

  it("Ends the game when health is 0", async () => {
    let damage = new anchor.BN(100);
    const tx = await program.methods
      .attack(challengeId, damage)
      .accounts({
        attacker: challenger.publicKey,
      })
      .signers([challenger])
      .rpc();

    const account = await program.account.challengeAccount.fetch(challengeAccount);
    const challenge = account.challenges.find(
      (ch) => ch.challengeId.toString() === challengeId.toString(),
    );
    assert.isNotNull(challenge?.state.ended, "The game should end when health is 0.");
  });
});
