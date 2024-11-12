"use client";

import { useEffect, useState } from "react";

export const Button = () => {
    const [blinkURLState, setBlinkUrlState] = useState<string>("");

    useEffect(() => {
        setBlinkUrlState(`https://dial.to/?action=solana-action:${window.location.origin}/api/actions/create-guess-challange&cluster=devnet`);
    }, []);

    return (
        <button
            className="text-black"
            onClick={() => {
                window.location.href = blinkURLState;
            }}
        >
            Challenge A Friend
        </button>
    );
}