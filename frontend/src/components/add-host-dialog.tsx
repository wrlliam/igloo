"use client";

import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";

import { Copy, Check } from "lucide-react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const hostSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  ipAddress: z
    .string()
    .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Invalid IP address format"),
});

export default function AddHostDialog() {
  const form = useForm<z.infer<typeof hostSchema>>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      name: "",
      ipAddress: "",
    },
  });

  const [copied, setCopied] = useState(false);

  const installCommand =
    `curl -fsSL https://raw.githubusercontent.com/wrlliam/igloo/main/install-agent.sh ` +
    `-o install-agent.sh && chmod +x install-agent.sh && sudo ./install-agent.sh`;

  function onSubmit(values: z.infer<typeof hostSchema>) {
    console.log("Host submitted:", values);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-fit cursor-pointer">Add Host</Button>
      </DialogTrigger>

      {/* IMPORTANT: min-w-0 added here */}
      <DialogContent className="min-w-0">
        <DialogHeader>
          <DialogTitle>Add Host</DialogTitle>
          <DialogDescription>
            Add a new host to Igloo so you can manage it, update it, and command
            it alongside your other machines — politely, of course.
          </DialogDescription>
        </DialogHeader>

        {/* Also add min-w-0 to form wrapper */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-w-0 flex-col gap-4 pt-4"
          >
            {/* Host Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Server Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* IP Address */}
            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Address</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Install Command */}
            <div className="flex min-w-0 flex-col gap-1.5">
              <FormLabel>Install Command</FormLabel>

              {/* Parent flex MUST have min-w-0 */}
              <div className="flex w-full min-w-0 items-center gap-2">
                <div
                  className="border-input bg-muted text-muted-foreground flex h-9 w-full min-w-0 items-center overflow-x-auto overflow-y-hidden rounded-md border px-3 font-mono text-sm whitespace-nowrap shadow-sm select-none"
                  tabIndex={-1}
                  aria-readonly="true"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {installCommand}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-background hover:bg-accent flex h-9 w-9 items-center justify-center rounded-md border"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-muted-foreground text-sm">
                Please run this command on the host before clicking{" "}
                <strong>Add Host</strong>, otherwise the host will not be
                detected.
              </p>
            </div>

            <Button type="submit">Add Host</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
