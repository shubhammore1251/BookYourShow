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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/zod-schemas/auth";
import api from "@/lib/axios";
import { z } from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Spinner } from "./ui/spinner";
import PasswordValidator from "password-validator";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";
import GoogleSignIn from "./GoogleSignIn";

type SignupFormData = z.infer<typeof signupSchema>;

const schema = new PasswordValidator();

schema
  .is()
  .min(8) // Minimum length 8
  .is()
  .max(50) // Maximum length 50
  .has()
  .uppercase() // Must have uppercase letters
  .has()
  .lowercase() // Must have lowercase letters
  .has()
  .digits(2) // Must have at least 2 digits
  .has()
  .symbols() // Must have at least 1 special char
  .has()
  .not()
  .spaces(); // Should not have spaces

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    if (!schema.validate(data.password)) {
      toast.error(
        "Password must have uppercase, lowercase, numbers & special characters."
      );
      return;
    }

    try {
      const res = await api.post("/api/auth/signup", data);
      if (res.status === 201 && res.data.success) {
        toast.success("Signup successful");
        router.push("/auth/login");
      } else {
        toast.error("Signup failed");
      }
    } catch (err: any) {
      console.log("Signup error:", err.response?.data || err.message);
      toast.error("Some error occurred");
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            {...register("name")}
            id="name"
            type="text"
            placeholder="John Doe"
            required
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            {...register("email")}
            id="email"
            type="email"
            placeholder="m@example.com"
            required
          />
          {errors.email && (
            <p className="text-red-500 text-sm mb-2">{errors.email.message}</p>
          )}
          <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
            <p className="text-red-500 text-sm mb-2">
              {errors.password.message}
            </p>
          )}
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <div className="relative">
            <Input
              {...register("confirmPassword")}
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirmPassword ? <IconEye /> : <IconEyeOff />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mb-2">
              {errors.confirmPassword.message}
            </p>
          )}

          <FieldDescription>Please confirm your password.</FieldDescription>
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
            {isSubmitting && <Spinner className="mr-2" />}
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <GoogleSignIn type="signup" />
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
