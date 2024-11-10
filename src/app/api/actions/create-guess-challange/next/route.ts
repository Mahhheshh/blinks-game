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
  const payload: CompletedAction = {
    type: "completed",
    title: "Your Guess Challange has been created successfully!",
    icon: new URL("/solana_devs.jpg", new URL(req.url).origin).toString(),
    label: "Catoff Guess Challange Created",
    description: "some message",
  };

  return Response.json(payload, { headers });
};
