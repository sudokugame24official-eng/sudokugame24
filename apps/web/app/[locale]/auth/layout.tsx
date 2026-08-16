import type { Metadata } from "next";

// Auth pages must never be indexed (P1-R rule).
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
