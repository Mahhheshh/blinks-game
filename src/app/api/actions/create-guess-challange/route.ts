import {
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
} from "@solana/actions";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { GuessProgram } from "@/common/guess_program";
import GuessProgramIDL from "@/common/idl/guess_program.json";

const headers = createActionHeaders();

const derivePDA = async (challengeId: number) => {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("guess"), new BN(challengeId).toArrayLike(Buffer, "le", 8)],
    new PublicKey(GuessProgramIDL.address),
  );
  return pda;
};

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    title: "Create a Guess Challenge",
    icon: new URL("/solana_devs.jpg", new URL(req.url).origin).toString(),
    description: "Create a number guessing challenge. Others will try to guess your secret number!",
    label: "Create Guess Challenge",
    links: {
      actions: [
        {
          type: "transaction",
          label: "Create a Guess Challenge",
          href: "/api/create-guess-challenge?secret-number={secret-number}&challenge-id={challenge-id}",
          parameters: [
            {
              name: "secret-number",
              label: "Enter Your Secret Number",
              required: true,
              type: "number",
            },
            {
              name: "challenge-id",
              label: "Enter Challenge ID",
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
  console.log("POST request received");

  try {
    const url = new URL(req.url);
    const secretNumberStr = url.searchParams.get("secret-number");
    console.log("Secret number from params:", secretNumberStr);

    if (!secretNumberStr || isNaN(Number(secretNumberStr))) {
      console.error("Invalid secret number:", secretNumberStr);
      return new Response(JSON.stringify({ error: "Invalid secret number provided" }), {
        status: 400,
        headers,
      });
    }

    const body: ActionPostRequest = await req.json();
    console.log("Request body received:", JSON.stringify(body));

    if (!body.account) {
      console.error("No account provided in body");
      return new Response(JSON.stringify({ error: "No account provided" }), {
        status: 400,
        headers,
      });
    }

    const userAccount = new PublicKey(body.account);
    console.log("User account:", userAccount.toString());

    const connection = new Connection("http://127.0.0.1:8899", "confirmed");
    //  new Connection(
    //   process.env.SOLANA_RPC || clusterApiUrl("devnet"),
    //   "confirmed",
    // );

    const program = new Program(
      GuessProgramIDL as any,
      new PublicKey(GuessProgramIDL.address),
      { connection },
    );

    const instruction = await program.methods
      .initialize(new BN(1), new BN(Number(secretNumberStr)))
      .accounts({
        initializer: userAccount,
      })
      .instruction();

    console.log("Instruction created successfully");

    const blockhash = await connection.getLatestBlockhash();
    console.log("Got blockhash:", blockhash.blockhash);

    const transaction = new Transaction({
      feePayer: userAccount,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);

    const response = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: transaction,
        message: "created guess challange",
      },
    });

    console.log("Response created successfully");
    return Response.json(response, { headers });
  } catch (error) {
    console.error("Error in POST handler:", error);
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
