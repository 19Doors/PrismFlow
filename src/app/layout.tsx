import {  AuthProvider, Navbar, SideBar } from "./components";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en">
        <body className="m-4">
          <SidebarProvider defaultOpen={false}>
            <SideBar />
            <SidebarTrigger />
            {children}
          </SidebarProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
