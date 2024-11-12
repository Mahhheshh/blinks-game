import type { Metadata } from "next";
import "./index.css";

export const metadata: Metadata = {
    title: "Blink Games",
    description: "playable solana blinks",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className="antialiased"
            >
                {children}
            </body>
        </html>
    );
}