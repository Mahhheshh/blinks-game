import Image from "next/image"
import { Button } from "../../component/button"
// import { Sparkles } from "lucide-react"

export default function Component() {
  return (
    <div className="min-h-screen flex items-center flex-col justify-center p-4 bg-gradient-to-b from-yellow-50 to-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-4 top-1/4 w-24 h-24 bg-yellow-200 rounded-full blur-xl opacity-60" />
        <div className="absolute -right-4 top-2/3 w-32 h-32 bg-yellow-200 rounded-full blur-xl opacity-60" />
      </div>

      <div className="relative w-full max-w-lg mx-auto text-center space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
          {/* <Sparkles className="w-6 h-6 text-yellow-500" /> */}
          Number Guessing Challenge
          {/* <Sparkles className="w-6 h-6 text-yellow-500" /> */}
        </h1>

        <p className="text-lg md:text-xl text-gray-600 font-medium max-w-md mx-auto leading-relaxed">
          Challenge your friends to an exciting number guessing game!
        </p>

        <div className="bg-white p-8 rounded-md shadow-lg shadow-gray-500 w-full max-w-md border">
          <div className="relative w-full h-64 mb-4">
            <Image
              src="/guess-game-icon.png"
              alt="Image"
              fill
              style={{ objectFit: "contain" }}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-center text-2xl font-semibold mb-4">
            Guess The Number
          </h1>

          <div className="flex items-center justify-center">
            <div className="py-2 px-6 rounded-md border border-black" style={{ backgroundColor: "rgb(222, 255, 90)" }}
            >
              <Button />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}