import { deriveGuessPdaById, getIconUrl, initGuessingGame } from "@/common/helper/guess.helper";
import { BN } from "@coral-xyz/anchor";
import {
  ActionGetResponse,
  ActionPostRequest,
  CompletedAction,
  createActionHeaders,
  createPostResponse,
  NextAction,
  NextActionLink,
} from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";

const headers = createActionHeaders();

const createGuessAction = async (origin: string, challangeId: string): Promise<NextAction> => {
  return {
    icon: new URL("/solana_devs.jpg", origin).toString(),
    title: "Guess The Number",
    description: "Guess the Number set by your friend",
    label: "Guess",
    links: {
      actions: [
        {
          type: "transaction",
          href: `/api/actions/guess?challange-id=${challangeId}&guess={guess}`,
          label: `Guess`,
          parameters: [
            {
              name: "guess",
              label: "Enter Your Guess",
              type: "number",
              required: true,
            },
          ],
        },
      ],
    },
  } as NextAction;
};

export const GET = async (req: Request) => {
  const challangeId = new URL(req.url).searchParams.get("challenge-id");

  const { program } = await initGuessingGame();
  const { pdaAccount } = await deriveGuessPdaById(challangeId!); // TODO: fix dis

  const account = await program.account.guessAccount.fetch(pdaAccount);

  if (account.winner) {
    const payload: CompletedAction = {
      type: "completed",
      title: `winner of this challange is: ${account.winner}`,
      description: "thank you for playing everyone",
      icon: await getIconUrl(),
      label: "Winner Announced",
    };
    return Response.json(payload, {
      status: 200,
      headers,
    });
  }

  const payload: ActionGetResponse = {
    icon: await getIconUrl(),
    title: "Guess The Number",
    description: "Guess the Number set by your friend",
    label: "Guess",
    links: {
      actions: [
        {
          type: "transaction",
          href: `/api/actions/guess?challange-id=${challangeId}&guess={guess}`,
          label: `Guess`,
          parameters: [
            {
              name: "guess",
              label: "Enter Your Guess",
              type: "number",
              required: true,
            },
          ],
        },
      ],
    },
  };

  return Response.json(payload, {
    headers,
  });
};

export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  try {
    console.log("Received POST request");
    const baseUrl = new URL(req.url);
    console.log("Base URL:", baseUrl.toString());
    const challangeId = baseUrl.searchParams.get("challange-id");
    console.log("Challenge ID:", challangeId);
    const guess = baseUrl.searchParams.get("guess");
    console.log("Guess:", guess);

    if (!challangeId || !guess || isNaN(Number(challangeId)) || isNaN(Number(guess))) {
      console.log("Invalid challenge ID or guess");
      return new Response(
        JSON.stringify({
          error: "Invalid challenge ID or guess",
        }),
        {
          status: 400,
          headers,
        },
      );
    }

    const body: ActionPostRequest = await req.json();
    console.log("Request body:", body);
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
      console.log("Account:", account.toString());
    } catch (error) {
      console.log("Invalid Account Provided");
      return Response.json("Invalid Account", {
        status: 400,
        headers,
      });
    }

    const { program, connection } = await initGuessingGame();
    console.log("Initialized Guess Program");

    const { pdaAccount } = await deriveGuessPdaById(challangeId);
    console.log("pda Account init", pdaAccount);

    const dataAccount = await program.account.guessAccount.fetch(pdaAccount);

    const instruction = await program.methods
      .guess(new BN(guess))
      .accounts({
        guesser: account,
        pdaAccount: pdaAccount,
      })
      .instruction();
    console.log("Created instruction");

    const blockhash = await connection.getLatestBlockhash();
    console.log("Blockhash:", blockhash);

    const transaction = new Transaction({
      feePayer: account,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);
    console.log("Created transaction");

    let nextActionPayload: NextActionLink;
    if (new BN(guess).eq(dataAccount.secretNumber)) {
      console.log("Correct guess");
      nextActionPayload = {
        type: "post",
        href: `/api/actions/guess/end`,
      };
    } else {
      console.log("Incorrect guess");
      nextActionPayload = {
        type: "inline",
        action: {
          type: "action",
          icon: await getIconUrl(),
          title: "Guess The Number",
          description: "Guess the Number set by your friend",
          label: "Guess",
          links: {
            actions: [
              {
                type: "transaction",
                href: `/api/actions/guess?challange-id=${challangeId}&guess={guess}`,
                label: `Guess`,
                parameters: [
                  {
                    name: "guess",
                    label: "Enter Your Guess",
                    type: "number",
                    required: true,
                  },
                ],
              },
            ],
          },
        },
      };
    }

    const payload = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: transaction,
        links: {
          next: nextActionPayload,
        },
      },
    });
    console.log("Created post response payload");

    console.log("Valid challenge ID and guess");
    return Response.json(payload, {
      status: 200,
      headers,
    });
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
