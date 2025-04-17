"use client";
import { signIn, useSession } from "next-auth/react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmailTable } from "../components";

export default function Emails() {
  const [emails, setEmail] = useState([]);
  const [loading, setLoading] = useState(false);
  async function fetchEmails() {
    try {
      setLoading(true);
      const response = await fetch("/api/emails");
      if (!response.ok) console.error("Error fetching for emails");
      const em = await response.json();
      // console.log(em);
      setEmail(em);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  }
  const { data: session, status } = useSession();
  useEffect(() => {
    fetchEmails();
  }, []);
  return (
    <div className="w-full">
      {status == "unauthenticated" && (
        <div className="flex flex-col justify-center items-center w-full">
          <Card className="shadow-lg p-6 font-founders rounded-sm">
            <CardTitle className="text-xl">Not connected to Google</CardTitle>
            <CardContent>
              <Button
                className="w-full cursor-pointer"
                onClick={() => signIn("google")}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {status == "authenticated" && (
        <div className="flex flex-col w-full gap-y-4">
          <div className="flex justify-between items-baseline border-b">
            <h1 className="font-founders text-4xl font-bold">Emails</h1>
            <div>
              <Button
                variant="outline"
                size="default"
                className="font-founders cursor-pointer"
                onClick={fetchEmails}
              >
                <RefreshCw />
              </Button>
            </div>
          </div>
          {loading && (
            <div className="flex justify-center items-center h-screen font-founders font-bold">
              <p className="text-4xl">Loading</p>
            </div>
          )}
          {!loading && emails.length != 0 && (
            <div>
              <EmailTable emailData={emails} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
