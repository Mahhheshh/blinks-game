import { getIconUrl } from "@/common/helper/guess.helper";
import {
  ActionError,
  ActionPostRequest,
  CompletedAction,
  createActionHeaders,
} from "@solana/actions";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  return new Response(JSON.stringify({ message: "Method not supported" } as ActionError), {
    status: 403,
    headers,
  });
};

export const OPTIONS = async () => new Response(null, { headers });

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();
    const number = new URL(req.url).searchParams.get("number");
    const description = `The winner is: ${body.account}. The secret number was: ${number}`;
    const iconUrl = await getIconUrl();

    if (!iconUrl) {
      throw new Error("Icon URL could not be retrieved");
    }

    const payload: CompletedAction = {
      type: "completed",
      title: "Congratulations! The Number Has Been Guessed!",
      icon: iconUrl,
      label: "Challenge Ended!",
      description,
    };

    return new Response(JSON.stringify(payload), { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ message: errorMessage } as ActionError), {
      status: 500,
      headers,
    });
  }
};
