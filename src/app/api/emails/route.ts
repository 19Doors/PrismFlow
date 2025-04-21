"use server"
import { authOptions } from "@/app/lib/authOptions";
import { getLinkedAccounts } from "@/app/lib/dbData";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { linkedAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signIn } from "next-auth/react";
import { NextResponse } from "next/server";

async function refreshAccessToken(account) {
  try {
    if(Date.now()>account.expiresAt) {

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken,
      }),
    });
    const tokens = await response.json();
    const updatedAccount = {
      ...account,
      accessToken: tokens.accessToken,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      refreshToken: tokens.refresh_token ?? account.refreshToken,
    };

    await db.update(linkedAccounts)
      .set({
        accessToken: updatedAccount.accessToken,
        refreshToken: updatedAccount.refreshToken,
        expiresAt: updatedAccount.expiresAt,
      })
      .where(eq(linkedAccounts.email, account.email));
    }
  }catch(e) {
    console.error(e);
  }
}

async function fetchEmailsForAccount(account) {
  try {
    await refreshAccessToken(account);
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5",{headers:{Authorization: `Bearer ${account.accessToken}`}});
    // If not okay
    if(!response.ok) {
      console.log("Account: "+account.email+" needs authentication");
      await db.delete(linkedAccounts).where(eq(linkedAccounts.email,account.email));
      return null;
      // const error = await response.json();
      // throw new Error(JSON.stringify(error));
    }
    // If okay
    const data = await response.json();
    const details = await Promise.all(
      data.messages.map(async (msg: any) => {
      const detailRes= await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {headers:{Authorization: `Bearer ${account.accessToken}`}})
	if(!detailRes) return null;
	const mm = await detailRes.json();
	let plainText="";
	let htmlBody="";
	function findParts(part: any) {
	  if(!part) return;
	  if(part.mimeType=="text/plain" && part.body.size!=0) {
	    plainText += Buffer.from(part.body.data,"base64").toString("utf-8")+"\n";
	  }else if(part.mimeType=="text/html" && part.body.size!=0) {
	    htmlBody += Buffer.from(part.body.data,"base64").toString("utf-8")+"\n";
	  }
	  if(part.parts) part.parts.forEach(findParts);
	}
	findParts(mm.payload);
	return {
	  id: msg.id,
	  email: account.email,
	  thread_id: msg.threadId,
	  snippet:mm.snippet || "",
	  subject: mm.payload.headers.find((h:any)=>h.name=="Subject")?.value || "",
	  from: mm.payload.headers.find((h:any)=>h.name=="From")?.value || "",
	  date: mm.payload.headers.find((h:any)=>h.name=="Date")?.value || "",
	  replyTo: mm.payload.headers.find((h:any)=>h.name=="Reply-To")?.value || "",
	  plainText: plainText,
	  htmlBody: htmlBody
	}
      })
    );
    return details;
  }catch(e) {
    console.error(e);
  }
}

export async function GET() {
  const session = await auth();
  if(!session || !session.accessToken) {
    return NextResponse.json({error:"Not Authenticated"},{status:401});
  }
  try {
    let response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",{headers:{Authorization: `Bearer ${session.accessToken}`}});
    if(!response.ok) {
      console.error("primary account signed off");
      // const error = await response.json();
      // throw new Error(JSON.stringify(error));
      // await signIn('google')
      // response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5",{headers:{Authorization: `Bearer ${session.accessToken}`}});
    }
    const data = await response.json();
    let details = await Promise.all(
      data.messages.map(async (msg: any) => {
      const detailRes= await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {headers:{Authorization: `Bearer ${session.accessToken}`}})
	if(!detailRes) return null;
	const mm = await detailRes.json();
	console.log(mm);
	// console.log(mm.payload.parts);
	let plainText="";
	let htmlBody="";
	function findParts(part: any) {
	  if(!part) return;
	  if(part.mimeType=="text/plain" && part.body.size!=0) {
	    plainText += Buffer.from(part.body.data,"base64").toString("utf-8")+"\n";
	  }else if(part.mimeType=="text/html" && part.body.size!=0) {
	    htmlBody += Buffer.from(part.body.data,"base64").toString("utf-8")+"\n";
	  }
	  if(part.parts) part.parts.forEach(findParts);
	}
	findParts(mm.payload);
	return {
	  id: msg.id,
	  email: session.user.email,
	  labelIds: mm.labelIds,
	  thread_id: msg.threadId,
	  snippet:mm.snippet || "",
	  subject: mm.payload.headers.find((h:any)=>h.name=="Subject")?.value || "",
	  from: mm.payload.headers.find((h:any)=>h.name=="From")?.value || "",
	  date: mm.payload.headers.find((h:any)=>h.name=="Date")?.value || "",
	  replyTo: mm.payload.headers.find((h:any)=>h.name=="Reply-To")?.value || "",
	  plainText: plainText,
	  htmlBody: htmlBody
	}
      })
    )
    const accounts = await getLinkedAccounts();
    for(let account of accounts) {
      const accEmails = await fetchEmailsForAccount(account);
      if(!accEmails) continue;
      let temp = [...details,...accEmails];
      details = temp;
    }
    return NextResponse.json(details)
  }catch(e) {
    console.error(e);
  }
}
