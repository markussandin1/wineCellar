import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerManager } from "@/components/pwa/service-worker-manager";

const inter = Inter({ subsets: ["latin"] });
const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

export const metadata: Metadata = {
  title: "Wine Cellar - A Wine Collection Manager",
  description: "Track your wine collection effortlessly with label scanning and smart insights",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {!isPwaEnabled && <ServiceWorkerManager disabled />}
        {children}
      </body>
    </html>
  );
}
