import "./globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";

import { Toaster } from "react-hot-toast";
import { Providers } from "./(admin)/providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice AI Solutions Dashboard",
  description: "Voice AI Solutions Dashboard",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="dark:bg-gray-900">
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
