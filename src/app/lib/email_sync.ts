"use server"
import { authOptions } from "@/app/lib/authOptions";
import { getLinkedAccounts } from "@/app/lib/dbData";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { emails, linkedAccounts, users } from "@/lib/db/schema";
import { warn } from "console";
import { and, eq } from "drizzle-orm";
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
    console.log("Refresh Done");
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

async function getUserProfile(accessToken) {
  let response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile",{headers:{Authorization: `Bearer ${accessToken}`}});
  if(!response.ok) {
    console.log("signed off");
  }
  let res = await response.json();
  return res;
}

export async function checkFirstTimeSync(email: string) {
  let r = await db.select().from(users).where(eq(users.email,email!));
  if(!r[0].firstSync || r[0].firstSync!="false") {
    await db.update(users).set({firstSync:"false"}).where(eq(users.email,email!));
    return true;
  }
  return false;
}

export async function checkFirstTimeSyncAccounts(email: string) {
  let r = await db.select().from(linkedAccounts).where(eq(linkedAccounts.email,email!));
  if(!r[0].firstSync || r[0].firstSync!="false") {
    await db.update(linkedAccounts).set({firstSync:"false"}).where(eq(linkedAccounts.email,email!));
    return true;
  }
  return false;
}

export async function getHidFromDB(email:string) {
  let ans = await db.select().from(users).where(eq(users.email,email));
  return ans[0].historyId;
}

export async function getHidFromDBAccount(email:string) {
  let ans = await db.select().from(linkedAccounts).where(eq(linkedAccounts.email,email));
  return ans[0].historyId;
}

async function getMessageFromID(accessToken, msg,email) {
      const detailRes= await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {headers:{Authorization: `Bearer ${accessToken}`}})
	if(!detailRes) return null;
	const mm = await detailRes.json();
	// console.log(mm);
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
	  email: email,
	  labelIds: mm.labelIds,
	  threadId: msg.threadId,
	  snippet:mm.snippet || "",
	  subject: mm.payload.headers.find((h:any)=>h.name=="Subject")?.value || "",
	  from: mm.payload.headers.find((h:any)=>h.name=="From")?.value || "",
	  date: dateToUnix(mm.payload.headers.find((h:any)=>h.name=="Date")?.value || ""),
	  replyTo: mm.payload.headers.find((h:any)=>h.name=="Reply-To")?.value || "",
	  plainText: plainText,
	  htmlBody: htmlBody
	}
}

export async function incrementSync(accessToken: string, hid: string, email:string, account?:any) {
  try {
    let response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId="+hid,{headers:{Authorization: `Bearer ${accessToken}`}});
    if(!response.ok) {
      console.log("Access Token Expired "+email+" "+hid+" "+accessToken);
      if(account) {
	console.log("REFRESHING");
	await refreshAccessToken(account);
	const dd = await db.select().from(linkedAccounts).where(eq(linkedAccounts.email,email));
	return await incrementSync(dd[0].accessToken,hid,email);
      }
    }
    response=await response.json();
    console.log(response);
    // console.log(hid);
    // console.log(response.history[0]);
    if(!response.history) return null;
    for(let h of response.history) {
      console.log(h);
      if(!h.messagesAdded) {
	for(let m of h.messages) {
	  let mmm = {
	    id: m.id,
	    threadId: m.threadId
	  }
	let a = await getMessageFromID(accessToken,mmm,email);
	await db.update(users).set({historyId:response.historyId}).where(eq(users.email,email))
	await db.insert(emails).values({
	    id: a.id,
	    email: a.email,
	    labelIds: a.labelIds,
	    threadId: a.threadId,
	    snippet:a.snippet || "",
	    subject:a.subject,
	    from:a.from ,
	    date:a.date ,
	    replyTo:a.replyTo,
	    plainText: a.plainText,
	    htmlBody: a.htmlBody
	}).onConflictDoUpdate({
	    target: emails.id,
	    set: {
	      email: a.email,
	      labelIds: a.labelIds,
	      threadId: a.threadId,
	      snippet: a.snippet || "",
	      subject: a.subject,
	      from: a.from,
	      date: a.date,
	      replyTo: a.replyTo,
	      plainText: a.plainText,
	      htmlBody: a.htmlBody
	    }
	});
	}
	continue;
      }
      for(let m of h.messagesAdded) {
	let a = await getMessageFromID(accessToken,m.message,email);

	await db.insert(emails).values({
	    id: a.id,
	    email: a.email,
	    labelIds: a.labelIds,
	    threadId: a.threadId,
	    snippet:a.snippet || "",
	    subject:a.subject,
	    from:a.from ,
	    date:a.date ,
	    replyTo:a.replyTo,
	    plainText: a.plainText,
	    htmlBody: a.htmlBody
	}).onConflictDoUpdate({
	    target: emails.id,
	    set: {
	      email: a.email,
	      labelIds: a.labelIds,
	      threadId: a.threadId,
	      snippet: a.snippet || "",
	      subject: a.subject,
	      from: a.from,
	      date: a.date,
	      replyTo: a.replyTo,
	      plainText: a.plainText,
	      htmlBody: a.htmlBody
	    }
	});
	await db.update(users).set({historyId:response.historyId}).where(eq(users.email,email))
      }
    }
  }catch(e) {
    console.error(e);
  }

}
function dateToUnix(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }
    return Math.floor(date.getTime() / 1000);
  } catch (error) {
    console.error(`Error converting date "${dateString}": ${error}`);
    throw error;
  }
}

export async function firstTimeSync(session) {
  const currentSession = await auth();
  if(!session || !session.accessToken) {
    return "Not Authenticated";
  }
  try {
    let response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15",{headers:{Authorization: `Bearer ${session.accessToken}`}});
    if(!response.ok) {
      console.error(session.user.email+" account signed off");
    }
    let HID = await getUserProfile(session.accessToken);
    HID = HID.historyId;
    console.log(session.user.email+" "+HID);
    await db.update(users).set({historyId:HID});

    const data = await response.json();
    let details = await Promise.all(
      data.messages.map(async (msg: any) => {
      const detailRes= await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {headers:{Authorization: `Bearer ${session.accessToken}`}})
	if(!detailRes) return null;
	const mm = await detailRes.json();
	// console.log(mm);
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
	// console.log(mm);
	// console.log(mm.payload);
	if(!mm.payload.headers) return {};
	return {
	  id: msg.id,
	  email: session.user.email,
	  labelIds: mm.labelIds,
	  threadId: msg.threadId,
	  snippet:mm.snippet || "",
	  subject: mm.payload.headers.find((h:any)=>h.name=="Subject")?.value || "",
	  from: mm.payload.headers.find((h:any)=>h.name=="From")?.value || "",
	  date: dateToUnix(mm.payload.headers.find((h:any)=>h.name=="Date")?.value || ""),
	  replyTo: mm.payload.headers.find((h:any)=>h.name=="Reply-To")?.value || "",
	  plainText: plainText,
	  htmlBody: htmlBody
	}
      })
    )
    for (let m of details) {
      // console.log(m);
      await db.insert(emails).values({
	  id: m.id,
	  email: m.email,
	  labelIds: m.labelIds,
	  threadId: m.threadId,
	  snippet:m.snippet || "",
	  subject:m.subject,
	  from:m.from ,
	  date:m.date ,
	  replyTo:m.replyTo,
	  plainText: m.plainText,
	  htmlBody: m.htmlBody
      });
    }
    // const accounts = await getLinkedAccounts();
    // for(let account of accounts) {
    //   const accEmails = await fetchEmailsForAccount(account);
    //   if(!accEmails) continue;
    //   let temp = [...details,...accEmails];
    //   details = temp;
    // }
    return details;
  }catch(e) {
    console.error(e);
  }
}

export async function firstTimeSyncAccounts(session,aemail) {
  if(!session || !session.accessToken) {
    return "Not Authenticated";
  }
  try {
    let response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15",{headers:{Authorization: `Bearer ${session.accessToken}`}});
    if(!response.ok) {
      console.error(aemail+" account signed off");
    }
    let HID = await getUserProfile(session.accessToken);
    // console.log(HID);
    HID = HID.historyId;
    console.log(aemail+" "+HID);
    await db.update(linkedAccounts).set({historyId:HID}).where(eq(linkedAccounts.email,aemail));

    const data = await response.json();
    let details = await Promise.all(
      data.messages.map(async (msg: any) => {
      const detailRes= await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {headers:{Authorization: `Bearer ${session.accessToken}`}})
	if(!detailRes) return null;
	const mm = await detailRes.json();
	// console.log(mm);
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
	// console.log(mm);
	// console.log(mm.payload);
	if(!mm.payload.headers) return {};
	return {
	  id: msg.id,
	  email: aemail,
	  labelIds: mm.labelIds,
	  threadId: msg.threadId,
	  snippet:mm.snippet || "",
	  subject: mm.payload.headers.find((h:any)=>h.name=="Subject")?.value || "",
	  from: mm.payload.headers.find((h:any)=>h.name=="From")?.value || "",
	  date: dateToUnix(mm.payload.headers.find((h:any)=>h.name=="Date")?.value || ""),
	  replyTo: mm.payload.headers.find((h:any)=>h.name=="Reply-To")?.value || "",
	  plainText: plainText,
	  htmlBody: htmlBody
	}
      })
    )
    for (let m of details) {
      // console.log(m);
      await db.insert(emails).values({
	  id: m.id,
	  email: m.email,
	  labelIds: m.labelIds,
	  threadId: m.threadId,
	  snippet:m.snippet || "",
	  subject:m.subject,
	  from:m.from ,
	  date:m.date ,
	  replyTo:m.replyTo,
	  plainText: m.plainText,
	  htmlBody: m.htmlBody
      });
    }
    // const accounts = await getLinkedAccounts();
    // for(let account of accounts) {
    //   const accEmails = await fetchEmailsForAccount(account);
    //   if(!accEmails) continue;
    //   let temp = [...details,...accEmails];
    //   details = temp;
    // }
    return details;
  }catch(e) {
    console.error(e);
  }
}
