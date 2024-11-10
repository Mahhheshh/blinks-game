import {
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
} from "@solana/actions";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { GuessProgram } from "@/common/guess_program";
import idl from "@/common/idl/guess_program.json";

const headers = createActionHeaders();

const derivePDA = async (challengeId: number) => {
  const [pda] = await PublicKey.findProgramAddressSync(
    [Buffer.from("guess"), new BN(challengeId).toArrayLike(Buffer, "le", 8)],
    new PublicKey(idl.address),
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
          href: "/api/actions/create-guess-challange?secret-number={secret-number}&challenge-id={challenge-id}",
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

    const program = new Program(idl as GuessProgram, { connection });
    console.log("Program initialized");

    const pdaAccount = await derivePDA(2);

    const instruction = await program.methods
      .initialize(new BN(5), new BN(Number(secretNumberStr)))
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
            href: "/api/actions/create-guess-challange/next?secret-number={secret-number}&challenge-id={challenge-id}",
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
