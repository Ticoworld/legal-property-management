"use client";

import { useState, useEffect } from "react";
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
import { initializeSystem, checkSystemStatus } from "@/server/actions/setup";
import {
  Loader2,
  Shield,
  Building2,
  User,
  Key,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);

  // Check if system is already initialized
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkSystemStatus();
        if (result.isInitialized) {
          toast.error("System is already initialized");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error checking system status:", error);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [router]);

  // Step 1: Administrator
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Firm Identity
  const [firmName, setFirmName] = useState("Ogodo, Ogodo & Co.");
  const [chambersName, setChambersName] = useState("Beracah Chambers");
  const [address, setAddress] = useState(
    "14 Ojeawere Street, Abakaliki, Ebonyi State"
  );
  const [city, setCity] = useState("Abakaliki");
  const [state, setState] = useState("Ebonyi");
  const [solicitorName, setSolicitorName] = useState("K. O. Ogboso, Esq.");
  const [solicitorTitle, setSolicitorTitle] = useState("Legal Practitioner");

  const validateStep1 = () => {
    if (!adminName || !adminEmail || !adminPassword || !confirmPassword) {
      toast.error("All fields are required");
      return false;
    }
    if (adminPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (adminPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (
      !firmName ||
      !chambersName ||
      !address ||
      !city ||
      !state ||
      !solicitorName ||
      !solicitorTitle
    ) {
      toast.error("All firm details are required");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const result = await initializeSystem({
        adminName,
        adminEmail,
        adminPassword,
        firmName,
        chambersName,
        address,
        city,
        state,
        solicitorName,
        solicitorTitle,
      });

      if (result.success && result.recoveryKey) {
        setRecoveryKey(result.recoveryKey);
        setStep(3); // Go to success/key display step
        toast.success("System initialized successfully!");
      } else {
        toast.error(result.error || "Failed to initialize system");
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (recoveryKey) {
      navigator.clipboard.writeText(recoveryKey);
      toast.success("Recovery key copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {checking ? (
        <Card className="w-full max-w-md shadow-xl border-border">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl shadow-xl border-border">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {step === 1 && <User className="h-8 w-8 text-primary" />}
                {step === 2 && <Building2 className="h-8 w-8 text-primary" />}
                {step === 3 && <Shield className="h-8 w-8 text-red-600" />}
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center">
              {step === 1 && "The Administrator"}
              {step === 2 && "The Firm Identity"}
              {step === 3 && "System Initialized"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 &&
                "Create the Super Admin account for your legal practice"}
              {step === 2 && "Configure your firm's identity and branding"}
              {step === 3 && "Your secure recovery key has been generated"}
            </CardDescription>

            {/* Progress indicators - only show for steps 1 and 2 */}
            {step < 3 && (
              <div className="flex justify-center gap-2 mt-4">
                <div
                  className={`h-2 w-16 rounded-full transition-colors duration-300 ${
                    step >= 1 ? "bg-primary" : "bg-muted"
                  }`}
                />
                <div
                  className={`h-2 w-16 rounded-full transition-colors duration-300 ${
                    step >= 2 ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Administrator */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name</Label>
                  <Input
                    id="adminName"
                    placeholder="John Doe"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email Address</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
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
              </div>
            )}

            {/* Step 2: Firm Identity */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firmName">Firm Name</Label>
                    <Input
                      id="firmName"
                      placeholder="Ogodo, Ogodo & Co."
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chambersName">Chambers Name</Label>
                    <Input
                      id="chambersName"
                      placeholder="Beracah Chambers"
                      value={chambersName}
                      onChange={(e) => setChambersName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="14 Ojeawere Street, Abakaliki, Ebonyi State"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Abakaliki"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="Ebonyi"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="solicitorName">Solicitor Name</Label>
                    <Input
                      id="solicitorName"
                      placeholder="K. O. Ogboso, Esq."
                      value={solicitorName}
                      onChange={(e) => setSolicitorName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="solicitorTitle">Solicitor Title</Label>
                    <Input
                      id="solicitorTitle"
                      placeholder="Legal Practitioner"
                      value={solicitorTitle}
                      onChange={(e) => setSolicitorTitle(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Success & Recovery Key */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <Alert
                  variant="destructive"
                  className="border-red-500 bg-red-50"
                >
                  <Key className="h-4 w-4" />
                  <AlertTitle className="text-red-700 font-bold">
                    SAVE THIS KEY IMMEDIATELY
                  </AlertTitle>
                  <AlertDescription className="text-red-600">
                    This is the ONLY way to recover your account if you lose
                    access to your email or password. It will not be shown
                    again.
                  </AlertDescription>
                </Alert>

                <div className="p-6 bg-slate-900 rounded-lg relative group">
                  <pre className="text-2xl font-mono text-center text-white tracking-widest break-all">
                    {recoveryKey}
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={copyToClipboard}
                  >
                    Copy
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Admin account created</span>
                </div>

                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  size="lg"
                >
                  I have saved my key → Go to Login
                </Button>
              </div>
            )}

            {/* Navigation Buttons for Steps 1 & 2 */}
            {step < 3 && (
              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}

                {step === 1 ? (
                  <Button onClick={handleNext} className="ml-auto">
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="ml-auto"
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Initialize System
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
