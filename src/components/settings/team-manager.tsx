"use client";

import { useState, useTransition } from "react";
import { Key, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createUser,
  deleteUser,
  resetUserPassword,
} from "@/server/actions/team";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string | Date;
};

export function TeamManager({
  members,
  canManage,
}: {
  members: TeamMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>("VIEWER");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState<string | null>(
    null
  );
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    setDeletingId(userId);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success("User removed", {
          description: `${userName || "User"} has been removed from the team.`,
        });
        router.refresh();
      } else {
        toast.error("Failed to remove user", {
          description: result.message,
        });
      }
    } catch {
      toast.error("An error occurred while removing the user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (
    userId: string,
    userName: string | null
  ) => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetUserPassword(userId, newPassword);
      if (result.success) {
        toast.success("Password updated", {
          description: `Password for ${userName || "user"} has been reset.`,
        });
        setResetPasswordOpen(null);
        setNewPassword("");
      } else {
        toast.error("Failed to reset password", {
          description: result.message,
        });
      }
    } catch {
      toast.error("An error occurred while resetting password");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="ml-auto">
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-member-btn">Add Member</Button>
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
                        toast.success("Team member created");
                        setOpen(false);
                        router.refresh();
                      } else {
                        toast.error(res.message);
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
                    <Input
                      type="email"
                      name="email"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Default Password
                    </label>
                    <Input
                      type="password"
                      name="password"
                      placeholder="Min 8 characters"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select
                      value={role}
                      onValueChange={(v: UserRole) => setRole(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                        <SelectItem value="MANAGER">MANAGER</SelectItem>
                        <SelectItem value="ASSOCIATE">ASSOCIATE</SelectItem>
                        <SelectItem value="VIEWER">VIEWER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
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
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
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
                      variant={
                        m.role === "SUPER_ADMIN"
                          ? "default"
                          : m.role === "MANAGER"
                          ? "default"
                          : m.role === "ASSOCIATE"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password Dialog */}
                        <Dialog
                          open={resetPasswordOpen === m.id}
                          onOpenChange={(open) => {
                            setResetPasswordOpen(open ? m.id : null);
                            if (!open) setNewPassword("");
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <p className="text-sm text-muted-foreground">
                                Set a new password for{" "}
                                <strong>{m.name || m.email}</strong>
                              </p>
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">
                                  New Password
                                </Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  placeholder="Min 8 characters"
                                  value={newPassword}
                                  onChange={(e) =>
                                    setNewPassword(e.target.value)
                                  }
                                  disabled={isResetting}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setResetPasswordOpen(null);
                                    setNewPassword("");
                                  }}
                                  disabled={isResetting}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleResetPassword(m.id, m.name)
                                  }
                                  disabled={
                                    isResetting || newPassword.length < 8
                                  }
                                >
                                  {isResetting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    "Update Password"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Delete User Dialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="delete-user-btn"
                              disabled={deletingId === m.id}
                            >
                              {deletingId === m.id ? "Removing..." : "Remove"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove team member?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove{" "}
                                <strong>{m.name || m.email}</strong> from the
                                team? This action cannot be undone. The user
                                will lose access to the system immediately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(m.id, m.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid="confirm-delete-user-btn"
                              >
                                Remove User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
