"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createUser, deleteUserAction } from "@/server/actions/team";

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "ASSOCIATE" | "VIEWER";
  createdAt: string | Date;
};

export function TeamManager({ members, isAdmin }: { members: TeamMember[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"ADMIN" | "ASSOCIATE" | "VIEWER">("VIEWER");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="ml-auto">
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Add Member</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <form
                  action={async (formData: FormData) => {
                    startTransition(async () => {
                      formData.set("role", role);
                      const res = await createUser(formData);
                      if (res.success) {
                        setOpen(false);
                      }
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input name="name" placeholder="Full name" required />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" name="email" placeholder="email@example.com" required />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Default Password</label>
                    <Input type="password" name="password" placeholder="Min 8 characters" required />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={role} onValueChange={(v: "ADMIN"|"ASSOCIATE"|"VIEWER") => setRole(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="ASSOCIATE">ASSOCIATE</SelectItem>
                        <SelectItem value="VIEWER">VIEWER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Name</TableHead>
              <TableHead className="w-[30%]">Email</TableHead>
              <TableHead className="w-[20%]">Role</TableHead>
              <TableHead className="w-[20%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="pr-6">{m.name || "—"}</TableCell>
                  <TableCell className="pr-6">{m.email}</TableCell>
                  <TableCell className="pr-6">
                    <Badge
                      variant={m.role === "ADMIN" ? "default" : m.role === "ASSOCIATE" ? "secondary" : "outline"}
                    >
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <form
                        action={async (fd) => {
                          await deleteUserAction(fd);
                        }}
                        className="inline-flex"
                      >
                        <input type="hidden" name="userId" value={m.id} />
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
