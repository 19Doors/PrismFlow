"use client";
import { signIn, useSession } from "next-auth/react";
import { GmailReader } from "../components";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { data: session, status } = useSession();
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
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-baseline">
            <h1 className="font-founders text-4xl font-bold">
              Email Summaries
            </h1>
            <div>
              <Button
                variant="outline"
                size="default"
                className="font-founders cursor-pointer"
              >
                <RefreshCw />
              </Button>
            </div>
          </div>
          <Separator />
          <div></div>
        </div>
      )}
    </div>
  );
}
