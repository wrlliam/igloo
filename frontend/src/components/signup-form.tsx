"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";

import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { authClient } from "~/server/better-auth/client";

//
// Zod Signup Schema
//
const signupSchema = z
  .object({
    email: z.email("Invalid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/^\S+$/, "Password cannot contain spaces")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  //
  // Handle Signup
  //
  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setLoading(true);

    const { email, password } = values;

    const result = await authClient.signUp.email({
      email,
      password,
      name: email,
      callbackURL: "/login",
    });

    setLoading(false);

    if (result.error) {
      toast.error(result.data ?? "Signup failed.");
      return;
    }

    toast.success("Account created successfully!");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6 p-6 md:p-8"
            >
              {/* Header */}
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm">
                  Enter your email below to create your account
                </p>
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="m@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password + Confirm */}
              <div className="grid grid-cols-2 gap-4">
                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPass ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>

                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="text-muted-foreground absolute top-2.5 right-3"
                        >
                          {showPass ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showConfirm ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>

                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="text-muted-foreground absolute top-2.5 right-3"
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormDescription>
                Must be at least 8 characters long.
              </FormDescription>

              {/* Submit */}
              <Button disabled={loading} type="submit">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </form>
          </Form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/images/background.jpg"
              alt="Signup Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground px-6 text-center text-sm">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}
