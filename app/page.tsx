// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Link
        href="/chat"
        className="text-lg font-bold bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
      >
        Go to Sparky Chat
      </Link>
    </div>
  );
}
