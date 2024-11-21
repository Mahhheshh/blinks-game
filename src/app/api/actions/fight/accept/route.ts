import {
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ActionPostResponse,
} from "@solana/actions";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { RngFight } from "@/common/rng_fight";
import idl from "@/common/idl/rng_fight.json";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  const challengeId = new URL(req.url).searchParams.get("challengeId");
  const baseUrl =
    process.env.ENV === "prod" ? "https://blinks-game.onrender.com" : "http://localhost:3000";

  const payload: ActionGetResponse = {
    icon: `${baseUrl}/fight.jpeg`,
    title: "Enter the Battle Arena",
    description:
      "Step into the arena and face off in a thrilling fight challenge. Choose your moves from Kick, Defend, and Punch to outmaneuver your opponent and claim victory!",
    label: "Accept Challenge",
    ...(challengeId
      ? {}
      : {
          links: {
            actions: [
              {
                type: "post",
                href: `${baseUrl}/api/actions/fight?challengeId={challengeId}`,
                label: "Join Now",
                parameters: [
                  { name: "challengeId", required: true, type: "number", label: "Challenge ID" },
                ],
              },
            ],
          },
        }),
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
    const baseUrl = new URL(req.url);
    const challengeId = baseUrl.searchParams.get("challengeId");
    const challengeIdAsBn = new BN(challengeId);

    const body: ActionPostRequest = await req.json();
    console.log("Request body:", body);
    const account = new PublicKey(body.account);
    console.log("Account public key:", account.toString());

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const blockhash = await connection.getLatestBlockhash();
    console.log("Latest blockhash:", blockhash);

    const program = new Program(idl as RngFight, { connection });
    console.log("Program initialized");

    const instruction = await program.methods
      .acceptChallenge(challengeIdAsBn)
      .accounts({
        defender: account,
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
            type: "post",
            href: `${baseUrl.origin.toString()}/api/actions/fight?challengeId=${challengeId}}`,
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
