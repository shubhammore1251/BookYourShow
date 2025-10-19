import { GalleryVerticalEnd } from "lucide-react";

import { SignupForm } from "@/components/signup-form";
import Image from "next/image";

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-1">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="w-full flex justify-center gap-2 md:justify-center mb-4">
          <Image
            priority
            src="/logonobg.png"
            width={300}
            height={4}
            alt="Logo"
            className=""
            draggable="false"
          />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">
            <SignupForm />
          </div>
        </div>
      </div>
      {/* <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div> */}
    </div>
  );
}
