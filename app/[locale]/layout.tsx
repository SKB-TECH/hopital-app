import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import { SidebarProvider } from "@/contexts/SidebarContext";
import "../globals.css";
import {ReactQueryProvider} from "@/providers";
import { TenantConfigProvider } from "@/providers/TenantConfigProvider";
import {Toaster} from "sonner";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Afia-Smart",
    statusBarStyle: "default",
  },
  keywords: [
    "Afia"
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: "fr_CD",
    type: "website",
    images: [siteConfig.logo],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.logo],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1d4ed8",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
                                             children,
                                             params,
                                           }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
      <html
          lang={locale}
          className="h-full antialiased"
          suppressHydrationWarning
      >
      <body className="min-h-full bg-background text-foreground">
      <NextIntlClientProvider messages={messages}>
        <TenantConfigProvider>
          <SidebarProvider>
            <div className="flex min-h-screen flex-col">
              <main className="flex-1">
                <ReactQueryProvider>
                  <PWARegister />
                  {children}
                </ReactQueryProvider>
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{
                      classNames: {
                        toast: "rounded border border-slate-200 bg-white shadow-lg",
                        title: "text-sm font-semibold text-slate-900",
                        description: "text-sm text-slate-500",
                        error: "border-red-200 bg-red-50",
                        success: "border-green-200 bg-green-50",
                      },
                    }}
                />
              </main>
            </div>
          </SidebarProvider>
        </TenantConfigProvider>
      </NextIntlClientProvider>
      </body>
      </html>
  );
}
