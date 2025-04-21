import { AuthProvider, Navbar, SideBar } from "./components";
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
        <body className="">
          <SidebarProvider defaultOpen={false}>
            <div className="flex h-screen w-full">
              <div className="flex-none">
                <SideBar />
              </div>
              <div className="flex-1">{children}</div>
            </div>
          </SidebarProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
