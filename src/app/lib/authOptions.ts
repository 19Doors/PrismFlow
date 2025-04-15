import { handler } from "@/auth";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = handler
