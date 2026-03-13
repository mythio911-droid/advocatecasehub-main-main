import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShieldAlert, Users, Database } from "lucide-react";
import { seedDemoData } from "@/lib/FirebaseSeeder";

const TeamManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    }, (err) => {
      console.error("Error fetching users:", err);
      toast.error("Failed to load team members");
    });
    return () => unsub();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { status: "approved" });
      toast.success("User approved successfully!");
    } catch (err) {
      console.error("Error approving user:", err);
      toast.error("Failed to approve user.");
    }
  };

  const handleDemote = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { status: "pending" });
      toast.success("User access revoked.");
    } catch (err) {
      console.error("Error changing user status:", err);
      toast.error("Failed to revoke access.");
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    toast.info("Starting demo data seed...", { id: "seed-toast" });
    try {
      await seedDemoData((msg) => {
        toast.loading(msg, { id: "seed-toast" });
      });
      toast.success("Demo users generated successfully!", { id: "seed-toast" });
    } catch (err) {
      toast.error("Failed to generate demo users.", { id: "seed-toast" });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <DashboardLayout 
      title="Team & Access Management" 
      subtitle="Approve user requests and manage organization access"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isSeeding} 
          onClick={handleSeedData}
          className="border-primary text-primary hover:bg-primary/10 gap-2"
        >
          <Database className="h-4 w-4" />
          {isSeeding ? "Generating..." : "Seed 3 Demo Users"}
        </Button>
      }
    >
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="table-header text-left px-6 py-4">User</th>
                <th className="table-header text-left px-4 py-4">Contact</th>
                <th className="table-header text-center px-4 py-4">Role</th>
                <th className="table-header text-center px-4 py-4">Status</th>
                <th className="table-header text-center px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">ID: {u.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wider">
                      {u.role || 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {u.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/20 text-warning uppercase tracking-wider">
                        <ShieldAlert className="h-3.5 w-3.5" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/20 text-success uppercase tracking-wider">
                        <CheckCircle className="h-3.5 w-3.5" /> Approved
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {u.status === "pending" ? (
                      <Button size="sm" onClick={() => handleApprove(u.id)} className="w-24">Approve</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleDemote(u.id)} className="w-24 border-destructive text-destructive hover:bg-destructive hover:text-white">Revoke</Button>
                    )}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No users found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeamManagement;
