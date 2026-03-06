import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const feelingPassionate = localFont({
  src: "../fonts/FeelingPassionate.ttf",
  variable: "--font-dancing",
});

export const metadata: Metadata = {
  title: "the shelf",
  description: "Track your beauty and skincare products",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${feelingPassionate.variable} antialiased`}>
        <Navbar profile={profile} />
        <main>{children}</main>
      </body>
    </html>
  );
}
