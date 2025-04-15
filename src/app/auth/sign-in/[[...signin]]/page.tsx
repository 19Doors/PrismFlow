import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <SignIn fallbackRedirectUrl="/"/>
    </div>
  );
}
