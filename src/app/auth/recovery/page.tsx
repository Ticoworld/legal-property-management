"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { recoverAccount } from "@/server/actions/auth";
import { Loader2, Shield, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function RecoveryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async () => {
    // Basic validation
    if (!email || !recoveryKey || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await recoverAccount(email, recoveryKey, newPassword);

      if (result.success) {
        setSuccess(true);
        toast.success("Account recovered successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        toast.error(result.error || "Recovery failed. Invalid credentials.");
      }
    } catch (error) {
      console.error("Recovery error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-green-200">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-green-800">
              Success!
            </CardTitle>
            <CardDescription className="text-center text-green-700">
              Your password has been reset successfully. Redirecting you to
              login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            System Recovery
          </CardTitle>
          <CardDescription className="text-center">
            Super Admin Access Only
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-md p-4 text-sm text-amber-800 dark:text-amber-200 mb-4">
            <p className="font-semibold mb-1">Staff Access Note:</p>
            <p>
              If you are a staff member (Associate/Manager) and have lost your
              password, please <strong>contact your administrator</strong> to
              reset it. This form is likely not for you.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recoveryKey">Recovery Key</Label>
            <Input
              id="recoveryKey"
              type="text"
              placeholder="Enter Master Recovery Key"
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value)}
              className="font-mono uppercase"
            />
          </div>

          <hr className="my-4" />

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>

          <div className="text-center mt-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
