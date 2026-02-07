import Link from "next/link";

// TODO: Replace with proper landing page or redirect to dashboard
export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Prep Wisely</h1>
      <p className="text-gray-600 mb-6">
        Your UPSC exam preparation companion. Plan your studies, track your progress, and improve your weak areas.
      </p>
      <div className="flex gap-4">
        <Link href="/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Go to Dashboard
        </Link>
        <Link href="/day" className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50">
          Daily Planner
        </Link>
      </div>
    </div>
  );
}
