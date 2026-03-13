import { Scale, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const PendingApproval = () => {
  const { signOut } = useAuth();

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
          <Button variant="ghost" onClick={signOut}>Sign Out</Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] animate-fade-in text-center">
          <div className="glass-card rounded-2xl p-8 shadow-lg flex flex-col items-center">
            <div className="h-16 w-16 bg-warning/20 rounded-full flex items-center justify-center mb-6">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-3">Approval Pending</h1>
            
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Your account request has been successfully submitted. An administrator must approve your account before you can access the dashboard. 
              <br/><br/>
              Please check back later or contact your system administrator.
            </p>

            <Button onClick={signOut} variant="outline" className="w-full">
              Sign Out for Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
