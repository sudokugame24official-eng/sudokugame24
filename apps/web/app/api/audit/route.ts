import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const target = url.searchParams.get("target");

    if (action === "seo-check") {
      if (!target) return NextResponse.json({ error: "no target" });
      const res = await fetch(target);
      const html = await res.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      );
      const canonicalMatch = html.match(
        /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
      );
      const ogTitleMatch = html.match(
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      );
      const ogDescMatch = html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      );
      const hreflangMatches = [
        ...html.matchAll(
          /<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
        ),
      ].map((m) => ({ hreflang: m[1], href: m[2] }));
      const jsonLdMatch = html.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
      );

      return NextResponse.json({
        url: target,
        status: res.status,
        title: titleMatch ? titleMatch[1] : null,
        description: descMatch ? descMatch[1] : null,
        canonical: canonicalMatch ? canonicalMatch[1] : null,
        ogTitle: ogTitleMatch ? ogTitleMatch[1] : null,
        ogDesc: ogDescMatch ? ogDescMatch[1] : null,
        hreflang: hreflangMatches,
        hasJsonLd: !!jsonLdMatch,
      });
    }

    if (action === "tsc-web") {
      try {
        const { stdout, stderr } = await execAsync(
          "npx tsc --noEmit --skipLibCheck",
          {
            cwd: "c:\\Users\\21650\\.gemini\\antigravity\\scratch\\website sudoku\\apps\\web",
          },
        );
        return NextResponse.json({ stdout, stderr, ok: true });
      } catch (e: any) {
        return NextResponse.json({
          stdout: e.stdout,
          stderr: e.stderr,
          ok: false,
        });
      }
    }

    if (action === "tsc-api") {
      try {
        const { stdout, stderr } = await execAsync(
          "npx tsc --noEmit --skipLibCheck",
          {
            cwd: "c:\\Users\\21650\\.gemini\\antigravity\\scratch\\website sudoku\\apps\\api",
          },
        );
        return NextResponse.json({ stdout, stderr, ok: true });
      } catch (e: any) {
        return NextResponse.json({
          stdout: e.stdout,
          stderr: e.stderr,
          ok: false,
        });
      }
    }

    if (action === "lint") {
      try {
        const { stdout, stderr } = await execAsync("npm run lint", {
          cwd: "c:\\Users\\21650\\.gemini\\antigravity\\scratch\\website sudoku",
        });
        return NextResponse.json({ stdout, stderr, ok: true });
      } catch (e: any) {
        return NextResponse.json({
          stdout: e.stdout,
          stderr: e.stderr,
          ok: false,
        });
      }
    }

    return NextResponse.json({ error: "Unknown action" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
