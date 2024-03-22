import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.css';
import BootstrapClient from "@/components/BootstrapClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const value = process.env.BACKEND_HOST as string;

  return (
    <html lang="en">
      <body className={inter.className} data-bs-theme="dark">
          {children}
          <BootstrapClient />
      </body>
    </html>
  );
}
