import { useState } from "react";
import { Eye, EyeOff, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

const RequestAccess = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create the user's profile in Firestore and mark them as 'pending'
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        phone: "",
        role: "user",
        firm: "",
        status: "pending",
        createdAt: new Date().toISOString()
      });

      toast.success("Request submitted successfully!");
      // 3. User is automatically logged in by Firebase Auth, so redirect to dashboard
      // The App.tsx ProtectedRoute will catch them and redirect to /pending-approval
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to request access");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">AdvocateCaseOS</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
        </div>
      </nav>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="glass-card rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">Request Access</h1>
              <p className="text-sm text-muted-foreground mt-2">Create your team account</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 bg-secondary/50 border-border"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@firm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-secondary/50 border-border"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-secondary/50 border-border pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Access Request"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Enterprise Grade Legal Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestAccess;
