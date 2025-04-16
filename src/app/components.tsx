"use client";
import Link from "next/link";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { ReactNode, useState } from "react";
import {
  ColumnDef,
  createTable,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export function Navbar() {
  return (
    <div className="border-b flex justify-between">
      <Link href="/">
        <p className="font-founders font-bold text-3xl">PrismFlow</p>
      </Link>
      <Link href="/auth/sign-in">
        <p className="font-bold font-founders text-xl ">Login</p>
      </Link>
    </div>
  );
}

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MenubarSeparator } from "@/components/ui/menubar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
  },
  {
    title: "Emails",
    url: "/emails",
  },
  {
    title: "Projects",
    url: "/projects",
  },
];

export function SideBar() {
  const { data: session, status } = useSession();
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  return (
    <Sidebar className="font-inter" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className={`mt-2 ml-2 -mb-4`}>
        <p className="font-bold font-founders text-3xl">PrismFlow</p>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between">
        <SidebarGroup className="font-founders">
          <SidebarGroupLabel className="text-foreground2">
            Applications
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    onClick={() => {
                      setSelectedTab(item.title);
                    }}
                    className={`rounded ${selectedTab == item.title && "bg-border font-bold shadow/30"}`}
                  >
                    <Link href={item.url}>
                      <span className="text-xs font-inter">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="">
        {status == "unauthenticated" && (
          <div className="">
            <Button
              className="w-full font-inter font-bold cursor-pointer"
              variant="outline"
              onClick={() => {
                signIn("google");
              }}
            >
              Login
            </Button>
          </div>
        )}
        {status == "authenticated" && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="">
                  <SidebarMenuButton className="" size="lg">
                    <Avatar>
                      <AvatarImage src={`${session.user.image}`} />
                      <AvatarFallback>PF</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col font-inter">
                      <p className="text-sm font-bold">{session.user.name}</p>
                      <p className="text-xs text-foreground2">
                        {session.user.email}
                      </p>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 font-inter"
                  side="right"
                  sideOffset={4}
                >
                  <DropdownMenuItem
                    onClick={() => {}}
                    className="cursor-pointer"
                  >
                    Settings
                  </DropdownMenuItem>
                  <MenubarSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      signOut();
                    }}
                    className="cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
export function EmailTable({ emailData }) {
  type email = {
    snippet: string;
    from: string;
    subject: string;
  };
  let data = emailData;
  // let data: email[] = emailData.map((d: any) => {
  //   return {
  //     from: d.from,
  //     snippet: d.snippet,
  //     subject: d.subject,
  //   };
  // });
  const columns = [
    {
      accessorKey: "subject",
      header: () => <div className="font-bold font-inter">Subject</div>,
      cell: ({row}) => {
	let val = row.getValue("subject");
	return <div className="font-inter font-bold">{val}</div>
      }
    },
    {
      accessorKey: "from",
      header: () => <div className="font-bold font-inter">From</div>,
      cell: ({row}) => {
	let val = row.getValue("from");
	let showVal = val.substr(0,val.indexOf('<')).trim();
	return <div className="font-inter font-medium">{showVal}</div>
      }
    },
    {
      accessorKey: "snippet",
      header: () => <div className="font-bold font-inter">Snippet</div>,
    },
  ];
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  console.log(table.getRowModel().rows);
  return (
    <Table className="max-w-full">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => {
              return (
                <TableCell key={cell.id} className="whitespace-normal">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
