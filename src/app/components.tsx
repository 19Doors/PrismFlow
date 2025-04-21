"use client";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Letter } from "react-letter";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
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

import {
  Brain,
  Calendar,
  Home,
  Inbox,
  Minimize2,
  Search,
  Settings,
} from "lucide-react";

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
  SidebarProvider,
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
import { db } from "@/lib/db";
import { linkedAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  deleteAccountEmail,
  getEmailFromID,
  getLinkedAccounts,
} from "./lib/dbData";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { emailSummarize } from "./lib/AI/gemini";
import Markdown from "react-markdown";

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
  const [linkAcc, setLinkAcc] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  async function refreshLinkedAccounts() {
    if(!session) return null;
    try {
      const res = await getLinkedAccounts();
      setLinkAcc(res);
    } catch (e) {
      console.error(e);
    }
  }
  async function peaceSignOut() {
    await signOut();
  }
  async function deleteAccount(email: any) {
    try {
      await deleteAccountEmail(email);
    } catch (e) {
      console.error("ERROR DELETING ACCOUNT");
    }
  }
  useEffect(() => {
    refreshLinkedAccounts();
  }, [isLoading]);
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
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="cursor-pointer" size="lg">
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
                  {linkAcc.map((acc: any, id: number) => {
                    return (
                      <DropdownMenuItem key={id}>
                        <ContextMenu>
                          <ContextMenuTrigger>{acc.email}</ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              inset
                              className="font-inter font-medium"
                              onClick={() => {
                                deleteAccount(acc.email);
                              }}
                            >
                              LogOut
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </DropdownMenuItem>
                    );
                  })}
                  <MenubarSeparator />
                  <DropdownMenuItem
                    onClick={refreshLinkedAccounts}
                    className="cursor-pointer"
                  >
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      signIn("google");
                    }}
                    className="cursor-pointer"
                  >
                    Add Account
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {}}
                    className="cursor-pointer"
                  >
                    Settings
                  </DropdownMenuItem>
                  <MenubarSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      peaceSignOut();
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
function EmailSidebar() {
  return (
    <Sidebar
      collapsible="none"
      className="border-r md:h-full font-inter md:w-[280px]"
    >
      <SidebarHeader>
        <h1 className="font-bold text-4xl font-founders">Emails</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-light">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={`font-medium cursor-pointer ${currentMenu == "all" && "border"}`}
                >
                  All Inboxes
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
export function EmailTable({ emailData }) {
  let data = emailData;
  console.log(emailData[0].id);
  const [currentMenu, setCurrentMenu] = useState("all");
  const [currentEmail, setCurrentEmail] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [currentGenerateSummary, setCurrentGenerateSummary] = useState("");

  // Current Email Object
  const [CEO, sCEO] = useState(null);
  const [isCEL, setCEL] = useState(false);

  const { data: session, status } = useSession();
  const columns = [
    {
      accessorKey: "id",
    },
    {
      accessorKey: "subject",
    },
    {
      accessorKey: "from",
    },
    {
      accessorKey: "snippet",
    },
    {
      accessorKey: "email",
    },
    {
      accessorKey: "date",
    },
    {
      accessorKey: "labelIds",
    },
  ];
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  function dateToCurr(date) {
    const eDate = new Date(Number(date) * 1000);
    const nowDate = new Date();
    const isToday = eDate.toDateString() == nowDate.toDateString();
    if (isToday) {
      return eDate.toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return eDate.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
    });
  }
  async function loadCurrentEmail(id: string, email: string) {
    setShowSummary(false);
    console.log("CALLED" + id);
    setCurrentEmail(() => id);
    if (id == "") return null;
    // Primary Email Current Fetch
    setCEL(true);
    const currEmail = await getEmailFromID(email!, id);
    setCEL(false);
    sCEO(currEmail);
  }

  function extractNameAndEmail(input) {
    if (!input || typeof input !== "string") {
      return { name: null, email: null };
    }

    const openBracketIndex = input.indexOf("<");
    const closeBracketIndex = input.indexOf(">");

    let name = null;
    let email = null;

    if (openBracketIndex !== -1) {
      name = input.substring(0, openBracketIndex).trim();
    }

    if (openBracketIndex !== -1 && closeBracketIndex !== -1) {
      email = input.substring(openBracketIndex + 1, closeBracketIndex);
    }

    return { name, email };
  }
  function extractInitials(input: string) {
    input = input.toUpperCase();
    let x = input.split(" ");
    let res = "";
    for (let c of x) {
      res += c[0];
    }
    return res;
  }
  async function generateSummary() {
    if(!CEO) return null;
    setSummaryLoading(true);
    const response = await emailSummarize(CEO);
    setCurrentGenerateSummary(response);
    setSummaryLoading(false);
    setShowSummary(true);
    console.log(response);
  }
  return (
    <motion.div className="w-full flex overflow-hidden">
      <motion.div
        className="max-h-screen overflow-y-scroll"
        animate={{
          width: currentEmail != "" ? "50%" : "100%",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {table.getRowModel().rows.map((row, id) => (
          <motion.div
            key={id}
            className="border-b p-3 sm:p-4 flex justify-between hover:shadow-sm/40 cursor-pointer"
            onClick={() => loadCurrentEmail(row.getValue("id"),row.getValue('email'))}
          >
            <div className="grow min-w-0 font-inter flex gap-x-2">
              <div
                className={`${row.getValue("labelIds")?.includes("UNREAD") ? "bg-blue-500" : ""} w-2 h-2 rounded-full mt-2 flex-none`}
              />
              <div className="flex-1 flex flex-col max-w-full min-w-0">
                <div className="font-bold shrink">{row.getValue("from")}</div>
                <div className="font-medium text-sm shrink">
                  {row.getValue("subject")}
                </div>
                <span className="text-sm shrink overflow-hidden text-ellipse">
                  {row.getValue("snippet")}
                </span>
              </div>
            </div>
            <div className="text-right flex gap-x-2 flex-none text-sm text-gray-500 mt-1 sm:mt-0">
	      <p>{row.getValue("email")}</p>
              <p>{dateToCurr(row.getValue("date"))}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <AnimatePresence>
        {currentEmail != "" && (
          <motion.div
            className="p-4 border-l max-w-1/2 max-h-screen overflow-auto"
            initial={{ x: "100%", width: "0%" }}
            animate={{ x: "0%", width: "50%" }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 1,
            }}
          >
            {isCEL && (
              <div className="flex justify-center items-center font-founders h-screen font-bold text-2xl">
                Email Loading;
              </div>
            )}
            {!isCEL && (
              <div className="p-4 flex flex-col font-inter gap-y-4">
                <div className="flex flex-col gap-y-4 border-b">
                  <div className="flex justify-between items-start">
                    <p className="text-xl font-bold">{CEO.subject}</p>
                    <button
                      className="cursor-pointer m-0 p-0"
                      onClick={() => setCurrentEmail("")}
                    >
                      <Minimize2 />
                    </button>
                  </div>
                  <div className="flex gap-x-2">
                    {extractNameAndEmail(CEO.from).name != null && (
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>
                          {extractInitials(extractNameAndEmail(CEO.from).name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div>
                        <p className="font-medium">
                          {extractNameAndEmail(CEO.from).name}
                        </p>
                        <p className="font text-sm">
                          {extractNameAndEmail(CEO.from).email}
                        </p>
                      </div>
                      <div>
                        <motion.button className="text-xs font-medium flex cursor-pointer gap-x-2 underline" onClick={generateSummary}>
                          Generate Summary <Brain size="20" />
                        </motion.button>
			{
			  showSummary && (
			    <div className="text-xs">
			    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{
			      h2: ({node,...props}) => (
				<h2 className="font-bold mb-1 mt-2" {...props}/>
			      ),
			      ul: ({node, ...props}) => (
				<ul className="" {...props} />
			      ),
			      a: ({node, ...props}) => (
				<a className="underline text-[#C33149]" {...props} />
			      )
			    }}>
			      {currentGenerateSummary}
			    </ReactMarkdown>
			    </div>
			  )
			}
                      </div>
                    </div>
                  </div>
                  <div></div>
                </div>
                <div>
                  <Letter html={CEO.htmlBody} text={CEO.plainText} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
