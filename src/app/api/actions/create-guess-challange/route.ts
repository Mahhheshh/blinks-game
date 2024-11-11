import {
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
} from "@solana/actions";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { GuessingGame } from "@/common/guessing_game";
import idl from "@/common/idl/guessing_game.json";
import { deriveChallangePda, getIconUrl } from "@/common/helper/guess.helper";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    title: "Create a Guess Challenge",
    icon: await getIconUrl(),
    description: "Create a number guessing challenge. Others will try to guess your secret number!",
    label: "Create Guess Challenge",
    links: {
      actions: [
        {
          type: "transaction",
          label: "Create a Guess Challenge",
          href: "/api/actions/create-guess-challange?secret-number={secret-number}",
          parameters: [
            {
              name: "secret-number",
              label: "Enter Your Secret Number",
              required: true,
              type: "number",
            },
          ],
        },
      ],
    },
  };

  return Response.json(payload, { headers });
};

export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  try {
    console.log("Received POST request");

    const url = new URL(req.url);
    const secretNumberStr = url.searchParams.get("secret-number");
    console.log("Secret number:", secretNumberStr);

    if (!secretNumberStr || isNaN(Number(secretNumberStr))) {
      console.error("Invalid secret number provided");
      return new Response(JSON.stringify({ error: "Invalid secret number provided" }), {
        status: 400,
        headers,
      });
    }

    const body: ActionPostRequest = await req.json();
    console.log("Request body:", body);

    if (!body.account) {
      console.error("No account provided");
      return new Response(JSON.stringify({ error: "No account provided" }), {
        status: 400,
        headers,
      });
    }

    const userAccount = new PublicKey(body.account);
    console.log("User account:", userAccount.toString());

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    console.log("Connection established");

    const program = new Program(idl as GuessingGame, { connection });
    console.log("Program initialized");

    const { stateAccount, pdaAccount } = await deriveChallangePda(program);
    console.log("pda account", pdaAccount.toJSON());

    const instruction = await program.methods
      .initialize(new BN(Number(secretNumberStr)))
      .accounts({
        initializer: userAccount,
        pdaAccount: pdaAccount,
      })
      .instruction();
    console.log("Instruction created");

    const blockhash = await connection.getLatestBlockhash();
    console.log("Blockhash:", blockhash);

    const transaction = new Transaction({
      feePayer: userAccount,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);
    console.log("Transaction created");

    const response = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: transaction,
        message: "created guess challenge",
        links: {
          next: {
            type: "post",
            href: `/api/actions/create-guess-challange/next?secret-number=${secretNumberStr}&challenge-id=${stateAccount.currentChallengeId}`,
          },
        },
      },
    });
    console.log("Response created");

    return Response.json(response, { headers });
  } catch (error) {
    console.error("Failed to process request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers,
      },
    );
  }
};
