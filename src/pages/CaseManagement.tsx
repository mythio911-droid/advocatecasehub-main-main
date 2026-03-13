import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddNewCaseDialog } from "@/components/AddNewCaseDialog";
import { Filter, Download, MoreVertical, Calendar, CheckCircle2, Clock, Eye, Send, RefreshCw, Phone, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { sendCaseReminder, isHearingTomorrow } from "@/lib/twilioService";

const tabs = ["All Cases", "High Priority", "Archived"];

const CaseManagement = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [viewCaseOpen, setViewCaseOpen] = useState<number | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "cases"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const casesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCases(casesData);
    }, (error) => {
      console.error("Error fetching cases:", error);
      toast.error("Failed to load cases");
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddCase = async (newCase: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "cases"), {
        ...newCase,
        userId: user.uid
      });
      toast.success("Case added to Firebase");
    } catch (error) {
      console.error("Error adding case: ", error);
      toast.error("Failed to add case");
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await deleteDoc(doc(db, "cases", id));
      toast.success("Case deleted from Firebase");
    } catch (error) {
      console.error("Error deleting case: ", error);
      toast.error("Failed to delete case");
    }
  };

  const handleSendReminder = async (c: any) => {
    if (!user) return;
    setSending(c.id);
    try {
      const result = await sendCaseReminder(c, user.uid);
      if (result.clientResult.success) {
        toast.success(`✅ Reminder sent to ${c.clientName || "client"}!`);
        await updateDoc(doc(db, "cases", c.id), { notification_status: "sent" });
      } else {
        toast.error(`❌ Failed: ${result.clientResult.error}`);
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSending(null);
    }
  };

  return (
    <DashboardLayout
      title="Case Management"
      subtitle="Track and organize active legal proceedings and hearings"
      actions={<AddNewCaseDialog onAddCase={handleAddCase} />}
    >
      <div className="flex gap-4 mb-6">
        <div className="stat-card flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <div>
            <p className="table-header">Active</p>
            <p className="text-2xl font-bold text-foreground">{cases.filter(c => c.status !== 'Closed').length}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <Clock className="h-8 w-8 text-warning" />
          <div>
            <p className="table-header">Closed</p>
            <p className="text-2xl font-bold text-foreground">{cases.filter(c => c.status === 'Closed').length}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <MoreVertical className="h-8 w-8 text-primary" />
          <div>
            <p className="table-header">Total</p>
            <p className="text-2xl font-bold text-foreground">{cases.length}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${i === activeTab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-sm" onClick={() => toast.info("Filter options coming soon")}><Filter className="h-4 w-4" /> Filter</Button>
          <Button variant="outline" size="sm" className="gap-2 text-sm" onClick={() => {
            // Download CSV of cases
            const header = "Case Number,Title,Type,Court,Judge,Next Hearing";
            const rows = cases.map(c => [c.number, c.title, c.type, c.court, c.judge, c.hearing].join(",")).join("\n");
            const csv = header + "\n" + rows;
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "cases.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}><Download className="h-4 w-4" /> Download</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="table-header text-left px-6 py-3">Case Number</th>
                <th className="table-header text-left px-4 py-3">Type</th>
                <th className="table-header text-left px-4 py-3">Court</th>
                <th className="table-header text-left px-4 py-3">Client</th>
                <th className="table-header text-left px-4 py-3">Next Hearing</th>
                <th className="table-header text-left px-4 py-3">Reminder</th>
                <th className="table-header text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-foreground">{c.number}</p>
                    <p className="text-xs text-primary mt-0.5">{c.title}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">{c.type}</td>
                  <td className="px-4 py-4 text-sm text-foreground">{c.court}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-foreground font-medium">{c.clientName || "—"}</p>
                    {c.clientPhone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />{c.clientPhone}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {c.urgent || isHearingTomorrow(c.hearing) ? (
                        <span className="text-sm font-semibold text-destructive flex items-center gap-1">
                          <span>!</span>{isHearingTomorrow(c.hearing) ? "Tomorrow" : "Today"}
                        </span>
                      ) : (
                        <><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm text-foreground">{c.hearing}</span></>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {c.notification_status === "sent" ? (
                      <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Sent
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-7"
                        onClick={() => handleSendReminder(c)}
                        disabled={sending === c.id || !c.clientPhone}
                        title={!c.clientPhone ? "No client phone number" : "Send SMS reminder"}
                      >
                        {sending === c.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        {sending === c.id ? "Sending..." : "Remind"}
                      </Button>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Dialog open={viewCaseOpen === i} onOpenChange={(v) => setViewCaseOpen(v ? i : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader><DialogTitle>Case Details</DialogTitle></DialogHeader>
                          <div className="space-y-3 pt-2 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <div><p className="text-muted-foreground text-xs">Case Number</p><p className="text-foreground font-bold">{c.number}</p></div>
                              <div><p className="text-muted-foreground text-xs">Title</p><p className="text-foreground font-medium">{c.title}</p></div>
                              <div><p className="text-muted-foreground text-xs">Type</p><p className="text-foreground">{c.type}</p></div>
                              <div><p className="text-muted-foreground text-xs">Court</p><p className="text-foreground">{c.court}</p></div>
                              <div><p className="text-muted-foreground text-xs">Client</p><p className="text-foreground">{c.clientName || "—"}</p></div>
                              <div><p className="text-muted-foreground text-xs">Client Phone</p><p className="text-foreground">{c.clientPhone || "—"}</p></div>
                              <div><p className="text-muted-foreground text-xs">Advocate</p><p className="text-foreground">{c.advocateName || "—"}</p></div>
                              <div><p className="text-muted-foreground text-xs">Next Hearing</p><p className={`font-semibold ${(c.urgent || isHearingTomorrow(c.hearing)) ? "text-destructive" : "text-foreground"}`}>{c.hearing}</p></div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCase(c.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-destructive">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 flex items-center justify-between border-t border-border">
          <p className="text-sm text-muted-foreground">Showing {cases.length} case{cases.length === 1 ? '' : 's'}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CaseManagement;
