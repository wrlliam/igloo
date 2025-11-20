import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "~/components/theme-provider";

export const metadata: Metadata = {
  title: "Igloo",
  description: "Created by wrlliam",
  icons: [{ rel: "icon", url: "/images/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable}`}>
      <html lang="en" suppressHydrationWarning className={geist.variable}>
        <body suppressHydrationWarning className="overflow-hidden">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <div className="fixed inset-0 -z-10">
              <img
                src="/images/background.jpg"
                alt="Background"
                className="h-full w-full object-cover grayscale dark:brightness-[0.2]"
              />
            </div>

            <div className="relative z-10 h-screen overflow-y-auto">
              {children}
            </div>
          </ThemeProvider>
        </body>
      </html>
    </html>
  );
}
