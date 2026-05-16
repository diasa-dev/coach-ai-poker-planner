import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import { AppProviders } from "./app-providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Uplinea",
  description: "Daily accountability and performance planner for online poker players.",
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isAuthDisabledForSmoke =
  process.env.UPLINEA_DISABLE_AUTH === "1" ||
  process.env.NEXT_PUBLIC_UPLINEA_DISABLE_AUTH === "1" ||
  process.env.NEXT_PUBLIC_UPLINEA_DISABLE_AUTH === "true";
const shouldCanonicalizeLocalhost =
  process.env.NODE_ENV === "development" && clerkPublishableKey?.startsWith("pk_test_");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="pt-PT" className={poppins.variable}>
      <body>
        {shouldCanonicalizeLocalhost ? (
          <script
            dangerouslySetInnerHTML={{
              __html:
                "if (location.hostname === '127.0.0.1') location.replace('http://localhost' + (location.port ? ':' + location.port : '') + location.pathname + location.search + location.hash);",
            }}
          />
        ) : null}
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );

  if (isAuthDisabledForSmoke || !clerkPublishableKey) {
    return content;
  }

  return <ClerkProvider publishableKey={clerkPublishableKey}>{content}</ClerkProvider>;
}
