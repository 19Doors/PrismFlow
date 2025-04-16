import { authOptions } from "@/app/lib/authOptions";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if(!session || !session.accessToken) {
    return NextResponse.json({error:"Not Authenticated"},{status:401});
  }
  try {
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",{headers:{Authorization: `Bearer ${session.accessToken}`}});
    if(!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }
    const data = await response.json();
    console.log(data);
    return NextResponse.json(data)
  }catch(e) {
    console.error(e);
  }
}
