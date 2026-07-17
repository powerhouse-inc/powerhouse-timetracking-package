import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Powerhouse Operations",
  description: "Sales, delivery, billing and time on your own reactor",
};

// Read env at request time (not build) so one image works across deployments.
export const dynamic = "force-dynamic";

/** Values surfaced to the client via window.__ENV — read at request time from
 *  the server's process.env. See lib/config.ts. */
function runtimeEnv() {
  return {
    NEXT_PUBLIC_SWITCHBOARD_URL: process.env.NEXT_PUBLIC_SWITCHBOARD_URL ?? "",
    NEXT_PUBLIC_DRIVE_ID: process.env.NEXT_PUBLIC_DRIVE_ID ?? "",
    NEXT_PUBLIC_RENOWN_URL: process.env.NEXT_PUBLIC_RENOWN_URL ?? "",
    NEXT_PUBLIC_MODULES: process.env.NEXT_PUBLIC_MODULES ?? "",
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <script
          // Injected before hydration so config.ts sees it synchronously.
          dangerouslySetInnerHTML={{
            // Escape < so a value can't break out of the inline <script>.
            __html: `window.__ENV=${JSON.stringify(runtimeEnv()).replace(
              /</g,
              "\\u003c",
            )}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
