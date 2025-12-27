// app/[locale]/layout.tsx
import { LangProvider } from "@/providers/LangProvider";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/providers/QueryProviser";
import { ThemeProvider } from "@/providers/theme-provider";
import { Metadata } from "next";
import { APP_NAME } from "@/lib/constantes";
import Locale from "intl-locale-textinfo-polyfill";

import localFont from "next/font/local";

const cairo = localFont({
  src: [
    {
      path: "../../fonts/Cairo/static/Cairo-Regular.ttf",
      weight: "400",
    },
    {
      path: "../../fonts/Cairo/static/Cairo-Medium.ttf",
      weight: "500",
    },
    {
      path: "../../fonts/Cairo/static/Cairo-Bold.ttf",
      weight: "700",
    },
  ],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "GMAO-PRO est une application web pour gestion de la maintenance assisté par ordinateur",
  authors: { name: "GHALASS", url: "ghalass.com" },
  icons: {
    icon: "/images/wrench.png",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { direction: dir } = new Locale(locale).getTextInfo();

  return (
    <html suppressHydrationWarning lang={locale} dir={dir}>
      <body className={cairo.className}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <LangProvider locale={locale}>
              <UserProvider>
                <Toaster position="bottom-right" />
                {children}
              </UserProvider>
            </LangProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
