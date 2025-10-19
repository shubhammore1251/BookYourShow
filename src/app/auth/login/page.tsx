import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconHome } from "@tabler/icons-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center gap-2">
          <Image
            priority
            src="/logonobg.png"
            width={250}
            height={5}
            alt="Logo"
            className=""
            draggable="false"
          />
          <a href="/">
            <IconHome stroke={2} size={30} className="cursor-pointer" />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-lg">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          priority
          src="/cinema.png"
          alt="Image"
          fill
          objectFit="cover"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
