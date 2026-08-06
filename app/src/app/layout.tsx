import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { BetaBanner } from "@/components/layout/beta-banner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { SessionProvider } from "@/providers/session-provider";
import { SettingsProvider } from "@/providers/settings-provider";
import { ToastProvider } from "@/providers/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "生活再建ナビ",
  description: "災害後の行動OS — 次に何をすればよいかを案内します",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "生活再建ナビ",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#141820" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background pb-20">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider>
            <SessionProvider>
              <ToastProvider>
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
                >
                  メインコンテンツへスキップ
                </a>
                <OfflineBanner />
                <BetaBanner />
                <div
                  id="main-content"
                  className="relative z-0 mx-auto min-h-screen max-w-lg isolate bg-background"
                >
                  {children}
                </div>
                <BottomNav />
              </ToastProvider>
            </SessionProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
