import { deriveGuessPdaById, getIconUrl, initGuessingGame } from "@/common/helper/guess.helper";
import { BN } from "@coral-xyz/anchor";
import {
  ActionGetResponse,
  ActionPostRequest,
  CompletedAction,
  createActionHeaders,
  createPostResponse,
  NextActionLink,
} from "@solana/actions";
import { PublicKey, Transaction } from "@solana/web3.js";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const challangeId = new URL(req.url).searchParams.get("challenge-id");

    if (!challangeId || isNaN(Number(challangeId))) {
      return new Response(JSON.stringify({ error: "Invalid challenge ID" }), {
        status: 400,
        headers,
      });
    }

    const { program } = await initGuessingGame();
    const { pdaAccount } = await deriveGuessPdaById(challangeId);

    const account = await program.account.guessAccount.fetch(pdaAccount);

    if (account.winner) {
      const payload: CompletedAction = {
        type: "completed",
        title: `Winner of this challenge is: ${account.winner}`,
        description: `Thank you for playing everyone, The number was: ${account.secretNumber}`,
        icon: await getIconUrl(),
        label: "Winner Announced",
      };
      return new Response(JSON.stringify(payload), {
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
            href: `/api/actions/guess?challenge-id=${challangeId}&guess={guess}`,
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

    return new Response(JSON.stringify(payload), {
      headers,
    });
  } catch (error) {
    console.error("Failed to process GET request:", error);
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

export const OPTIONS = async () => new Response(null, { headers });

export const POST = async (req: Request) => {
  try {
    const baseUrl = new URL(req.url);
    const challangeId = baseUrl.searchParams.get("challenge-id");
    const guess = baseUrl.searchParams.get("guess");

    if (!challangeId || !guess || isNaN(Number(challangeId)) || isNaN(Number(guess))) {
      return new Response(JSON.stringify({ error: "Invalid challenge ID or guess" }), {
        status: 400,
        headers,
      });
    }

    const body: ActionPostRequest = await req.json();
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid Account" }), {
        status: 400,
        headers,
      });
    }

    const { program, connection } = await initGuessingGame();
    const { pdaAccount } = await deriveGuessPdaById(challangeId);
    const dataAccount = await program.account.guessAccount.fetch(pdaAccount);

    const instruction = await program.methods
      .guess(new BN(guess))
      .accounts({
        guesser: account,
        pdaAccount: pdaAccount,
      })
      .instruction();

    const blockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      feePayer: account,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);

    let nextActionPayload: NextActionLink;
    if (new BN(guess).eq(dataAccount.secretNumber)) {
      nextActionPayload = {
        type: "post",
        href: `/api/actions/guess/end?number=${guess}`,
      };
    } else {
      nextActionPayload = {
        type: "inline",
        action: {
          type: "action",
          icon: await getIconUrl(),
          title: "Guess The Number",
          description: `Guess the Number set by your friend. HINT: ${
            new BN(guess).gt(dataAccount.secretNumber)
              ? "Your guess was too high."
              : "Your guess was too low."
          }`,
          label: "Guess",
          links: {
            actions: [
              {
                type: "transaction",
                href: `/api/actions/guess?challenge-id=${challangeId}&guess={guess}`,
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

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to process POST request:", error);
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
