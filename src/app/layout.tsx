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
  let unreadCount = 0;
  if (user) {
    const [{ data: profileData }, { count }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);
    profile = profileData;
    unreadCount = count ?? 0;
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${feelingPassionate.variable} antialiased`}>
        <Navbar profile={profile} unreadCount={unreadCount} />
        <main>{children}</main>
      </body>
    </html>
  );
}
