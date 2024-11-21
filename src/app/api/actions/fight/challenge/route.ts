import {
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ActionPostResponse,
} from "@solana/actions";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { RngFight } from "@/common/rng_fight";
import idl from "@/common/idl/rng_fight.json";

const headers = createActionHeaders();
const baseUrl =
  process.env.ENV === "prod" ? "https://blinks-game.onrender.com" : "http://localhost:3000";

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    icon: `${baseUrl}/fight.jpeg`,
    title: "Create a Fight Challenge",
    description:
      "Engage in an epic fight challenge where you have three choices: Kick, Defend, and Punch. Choose your moves wisely to outsmart your opponent and emerge victorious!",
    label: "Create Challenge",
  };

  return Response.json(payload, {
    status: 200,
    headers,
  });
};

export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  try {
    console.log("Received POST request");
    const body: ActionPostRequest = await req.json();
    console.log("Request body:", body);
    const account = new PublicKey(body.account);
    console.log("Account public key:", account.toString());

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const blockhash = await connection.getLatestBlockhash();
    console.log("Latest blockhash:", blockhash);

    const program = new Program(idl as RngFight, { connection });
    console.log("Program initialized");

    const [challengeAccountAddress, _] = await PublicKey.findProgramAddressSync(
      [Buffer.from("challenges")],
      program.programId,
    );
    console.log("Challenge account address:", challengeAccountAddress.toString());

    const challengeAccount = await program.account.challengeAccount.fetch(challengeAccountAddress);
    console.log("Challenge account fetched:", challengeAccount.challenges);
    const challengeId = new BN(challengeAccount.challenges.length + 1);
    const instruction = await program.methods
      .createChallenge(challengeId)
      .accounts({
        challenger: account,
      })
      .instruction();
    console.log("Instruction created:", instruction);

    const tx = new Transaction({
      feePayer: account,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);
    console.log("Transaction created:", tx);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: tx,
        links: {
          next: {
            type: "inline",
            action: {
              type: "completed",
              icon: `${baseUrl}/fight.jpeg`,
              title: "Challenge Created Successfully!",
              label: "View Challenge",
              description: `Your fight challenge has been created. click to join ${baseUrl}/api/actions/fight/accept?challengeId=${challengeId}`,
            },
          },
        },
      },
    });
    console.log("Response payload:", payload);

    return Response.json(payload, {
      status: 200,
      headers: headers,
    });
  } catch (err) {
    console.error("Error occurred:", err);
    return Response.json("error", {
      status: 400,
      headers,
    });
  }
};
