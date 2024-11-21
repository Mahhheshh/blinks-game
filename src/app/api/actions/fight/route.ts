import {
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ActionPostResponse,
  CompletedAction,
} from "@solana/actions";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { RngFight } from "@/common/rng_fight";
import idl from "@/common/idl/rng_fight.json";

const headers = createActionHeaders();

const getProgram = async (): Promise<Program<RngFight>> => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const program = new Program(idl as RngFight, { connection });

  return program;
};

const getGame = async (
  challengeId: BN,
): Promise<{
  challengeId: BN;
  challenger: string;
  defender: string | null;
  challengerHealth: number;
  defenderHealth: number;
  currentTurn: string;
  state: Map<string, undefined | "">;
}> => {
  const program = await getProgram();

  const [address, _] = PublicKey.findProgramAddressSync(
    [Buffer.from("challenges")],
    program.programId,
  );

  const challengeAccount = await program.account.challengeAccount.fetch(address);

  return challengeAccount.challenges.find((challenge: any) =>
    challenge.challengeId.eq(challengeId),
  );
};

export const GET = async (req: Request) => {
  const baseUrl =
    process.env.ENV === "prod" ? "https://blinks-game.onrender.com" : "http://localhost:3000";
  const challengeId = new URL(req.url).searchParams.get("challengeId");

  let payload: ActionGetResponse;

  if (!challengeId) {
    payload = {
      icon: `${baseUrl}/fight.jpeg`,
      title: "Invalid Request",
      description: "Please Provide challengeId",
      label: "",
      disabled: true,
      links: {
        actions: [],
      },
    };
    return Response.json(payload, {
      status: 200,
      headers,
    });
  }

  const game = await getGame(new BN(challengeId));

  if (!game) {
    payload = {
      icon: `${baseUrl}/fight.jpeg`,
      title: "Invalid Challenge ID",
      description: "Please provide a valid challenge ID.",
      label: "",
      disabled: true,
      links: {
        actions: [],
      },
    };
    return Response.json(payload, {
      status: 200,
      headers,
    });
  }

  let description = "Choose kick to do 60% damage, punch to do 20% damage, or defend yourself";
  let title = "Choose A Move";

  if (game.defenderHealth === 0) {
    description = `The winner is ${game.challenger}`;
    title = "Game Over";
  } else if (game.challengerHealth === 0) {
    description = `The winner is ${game.defender}`;
    title = "Game Over";
  } else {
    description = `The game is ongoing. Current turn: ${game.currentTurn}. Defender's health: ${game.defenderHealth}, Challenger's health: ${game.challengerHealth}.`;
    title = "Game In Progress";
  }

  payload = {
    icon: `${baseUrl}/fight.jpeg`,
    title: title,
    description: description,
    label: "",
    disabled: game.defenderHealth === 0 || game.challengerHealth === 0,
    links: {
      actions: [
        {
          type: "post",
          href: `${baseUrl}/api/actions/fight?move=kick&challengeId=${challengeId}`,
          label: "🥋 Kick",
        },
        {
          type: "post",
          href: `${baseUrl}/api/actions/fight?move=punch&challengeId=${challengeId}`,
          label: "🥊 Punch",
        },
        {
          type: "post",
          href: `${baseUrl}/api/actions/fight?move=defend&challengeId=${challengeId}`,
          label: "🛡️ Defend",
        },
      ],
    },
  };

  return Response.json(payload, {
    status: 200,
    headers,
  });
};

export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  try {
    const baseUrl =
      process.env.ENV === "prod" ? "https://blinks-game.onrender.com" : "http://localhost:3000";
    const reqUrl = new URL(req.url);
    const challengeId = reqUrl.searchParams.get("challengeId");
    const challengeIdAsBn = new BN(challengeId);

    const game = await getGame(challengeIdAsBn);

    const move = reqUrl.searchParams.get("move");
    let payload: ActionPostResponse | CompletedAction;

    if (game.defenderHealth === 0) {
      payload = {
        type: "completed",
        icon: `${baseUrl}/fight.jpeg`,
        title: "Game Over",
        description: `The winner is ${game.challenger}`,
        label: "",
      };
    } else if (game.challengerHealth === 0) {
      payload = {
        type: "completed",
        icon: `${baseUrl}/fight.jpeg`,
        title: "Game Over",
        description: `The winner is ${game.challenger}`,
        label: "",
      };
    }

    let damage: BN;

    switch (move) {
      case "kick":
        damage = new BN(
          Math.random() < 0.5
            ? Math.floor(Math.random() * 41) + 20
            : -Math.floor(Math.random() * 21),
        );
        break;
      case "punch":
        damage = new BN(Math.floor(Math.random() * 11) + 10);
        break;
      case "defend":
        damage = new BN(0);
        break;
      default:
        throw new Error("Invalid move");
    }

    const body: ActionPostRequest = await req.json();
    const account = new PublicKey(body.account);

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const blockhash = await connection.getLatestBlockhash();

    const program = new Program(idl as RngFight, { connection });

    const instruction = await program.methods
      .attack(challengeIdAsBn, damage)
      .accounts({
        attacker: account,
      })
      .instruction();

    const tx = new Transaction({
      feePayer: account,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);

    

    payload = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: tx,
        links: {
          next: {
            type: "post",
            href: `${baseUrl}/api/actions/fight?challengeId=${challengeId}`,
          },
        },
      },
    });

    return Response.json(payload, {
      status: 200,
      headers: headers,
    });
  } catch (err) {
    return Response.json("error", {
      status: 400,
      headers,
    });
  }
};
