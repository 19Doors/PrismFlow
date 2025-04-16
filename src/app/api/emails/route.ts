import { authOptions } from "@/app/lib/authOptions";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if(!session || !session.accessToken) {
    return NextResponse.json({error:"Not Authenticated"},{status:401});
  }
  try {
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20",{headers:{Authorization: `Bearer ${session.accessToken}`}});
    if(!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }
    const data = await response.json();
    console.log(data);
    const details = await Promise.all(
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
	// console.log(plainText);
	// console.log(htmlBody);
	return {
	  id: msg.id,
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
    // console.log(details);
    return NextResponse.json(details)
  }catch(e) {
    console.error(e);
  }
}
