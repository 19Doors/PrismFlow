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
import {
  checkFirstTimeSync,
  checkFirstTimeSyncAccounts,
  firstTimeSync,
  firstTimeSyncAccounts,
  getHidFromDB,
  getHidFromDBAccount,
  incrementSync,
} from "../lib/email_sync";
import { getEmails, getLinkedAccounts } from "../lib/dbData";
import { Skeleton } from "@/components/ui/skeleton";

export default function Emails() {
  const [emails, setEmail] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  async function fetchEmails() {
    if(!session) return null;
    console.log("TRY")
    try {
      setLoading(true);
      console.log(session);
      console.log(status);
      if (status != "authenticated") {
        setLoading(false);
        return null;
      }
      //Check for primary
      let check = await checkFirstTimeSync(session?.user.email!);

      let accounts = await getLinkedAccounts();
      let cEmails = [session.user.email!];
      console.log(accounts);
      for(let account of accounts) {
	let acheck = await checkFirstTimeSyncAccounts(account.email);
	if(acheck) {
	  await firstTimeSyncAccounts(account,account.email);
	}else {
	  let hid = await getHidFromDBAccount(account.email);
	  await incrementSync(account.accessToken!, hid!, account.email!,account);
	}
	cEmails.push(account.email);
      }
      if (check) {
        await firstTimeSync(session);
      } else {
        let hid = await getHidFromDB(session?.user.email!);
        await incrementSync(session?.accessToken!, hid!, session.user.email!);
      }
      console.log(cEmails);
      let emailsAll = await getEmails(cEmails);
      console.log(emailsAll);
      setEmail(e=>emailsAll);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  }
  useEffect(() => {
    fetchEmails();
  }, [status]);
  return (
    <div className="w-full">
      {status == "unauthenticated" && (
        <div className="flex flex-col justify-center items-center w-full h-screen">
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
        <div className="flex w-full h-screen">
          {loading && (
            <div className="h-full w-full flex flex-col justify-center items-center font-bold font-founders text-2xl">
	      Loading
            </div>
          )}
          {!loading && emails && emails.length != 0 && (
            <div className="flex-1">
              <EmailTable emailData={emails} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
