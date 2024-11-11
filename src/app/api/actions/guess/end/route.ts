import { getIconUrl } from "@/common/helper/guess.helper";
import { ActionError, CompletedAction, createActionHeaders } from "@solana/actions";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  return Response.json({ message: "Method not supported" } as ActionError, {
    status: 403,
    headers,
  });
};

export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  const baseUrl = new URL(req.url);
  const description = `Congratulations! The winner is: 6TQyCGxqAy1gdRAy7wGzZZLatP1hpDZNyHCtc4ZxEcwR. `;
  const payload: CompletedAction = {
    type: "completed",
    title: "The Number has been guessed!",
    icon: await getIconUrl(),
    label: "Challenge Ended!",
    description: description,
  };

  return Response.json(payload, { headers });
};
