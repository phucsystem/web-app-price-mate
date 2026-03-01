import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-text">Page Not Found</h2>
        <p className="mt-2 text-text-soft">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-sm bg-primary px-6 py-2 text-white hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
