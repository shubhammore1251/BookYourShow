"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import api from "@/lib/axios"; // your axios instance
import { useState } from "react";
import { toast } from "react-hot-toast"; // optional: for notifications
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "./ui/spinner";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import GoogleSignIn from "./GoogleSignIn";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setIsLogedIn, setUser } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      const res = await api.post("/api/auth/login", data);
      if (res.status === 200 && res.data.success) {
        toast.success("Login successful!");
        // console.log("Login Response:", res.data);
        setIsLogedIn(true);
        setUser(res.data.data);
        router.push("/");
      } else {
        toast.error("Login failed!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed!");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <IconEye /> : <IconEyeOff />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={loading} className="cursor-pointer">
            {loading && <Spinner className="mr-2" />}
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          {/* <Button
            variant="outline"
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: "/", // redirect after login
              })
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="icon icon-tabler icons-tabler-filled icon-tabler-brand-google"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 2a9.96 9.96 0 0 1 6.29 2.226a1 1 0 0 1 .04 1.52l-1.51 1.362a1 1 0 0 1 -1.265 .06a6 6 0 1 0 2.103 6.836l.001 -.004h-3.66a1 1 0 0 1 -.992 -.883l-.007 -.117v-2a1 1 0 0 1 1 -1h6.945a1 1 0 0 1 .994 .89c.04 .367 .061 .737 .061 1.11c0 5.523 -4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10z" />
            </svg>
            Login with Google
          </Button> */}
           <GoogleSignIn type="login" />
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
