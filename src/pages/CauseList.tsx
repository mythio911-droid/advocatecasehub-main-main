import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, Download, FileSpreadsheet, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const getStatusClass = (status: string) => {
  switch (status) {
    case "LISTED": return "status-listed";
    case "BENCH CHANGED": return "status-changed";
    case "DISPOSED": return "status-disposed";
    default: return "status-badge bg-secondary text-secondary-foreground";
  }
};

const CauseList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [courtFilter, setCourtFilter] = useState("all");
  const [viewOpen, setViewOpen] = useState<number | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "listings"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const listingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setListings(listingsData);
    }, (error) => {
        console.error("Error fetching listings:", error);
        toast.error("Failed to load listings");
    });
    return () => unsubscribe();
  }, [user]);

  const filtered = listings.filter(l => {
    const matchCourt = courtFilter === "all" || l.court.toLowerCase().includes(courtFilter);
    const matchSearch = searchQuery === "" || l.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (l.parties && l.parties.petitioner && l.parties.petitioner.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (l.parties && l.parties.respondent && l.parties.respondent.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCourt && matchSearch;
  });

  return (
    <DashboardLayout
      title="Cause List Automation"
      subtitle="Automated daily listing matches for your portfolio"
      actions={
        <Button className="bg-primary text-primary-foreground font-semibold text-sm gap-2" onClick={() => toast.success("Sync started — checking all courts...")}>
          <RefreshCw className="h-4 w-4" /> Sync Now
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Cases Tracked" value={listings.length.toString()} trend={listings.length > 0 ? `${listings.length} on file` : "None yet"} trendType="positive" />
        <StatCard title="Matches Today" value={filtered.length.toString()} description={filtered.length > 0 ? `In ${[...new Set(filtered.map((l: any) => l.court))].length} Courts` : "No matches"} />
        <StatCard title="Listed" value={listings.filter((l: any) => l.status === 'LISTED').length.toString()} description="Active listings" />
        <StatCard title="Last Sync Time" value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} trend="✓ Synced" trendType="positive" />
      </div>

      <div className="bg-card rounded-xl border border-border p-4 mb-6 flex flex-wrap items-end gap-4" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="flex-1 min-w-[200px]">
          <label className="table-header block mb-1.5">Search Case/Party</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Type case number or party name" className="pl-9 h-10 bg-secondary/50" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="w-[180px]">
          <label className="table-header block mb-1.5">Court</label>
          <Select value={courtFilter} onValueChange={setCourtFilter}>
            <SelectTrigger className="h-10 bg-secondary/50"><SelectValue placeholder="All Courts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courts</SelectItem>
              <SelectItem value="supreme">Supreme Court</SelectItem>
              <SelectItem value="madras">Madras High Court</SelectItem>
              <SelectItem value="delhi">Delhi High Court</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <label className="table-header block mb-1.5">Date</label>
          <Input type="date" defaultValue="2023-10-24" className="h-10 bg-secondary/50" />
        </div>
        <Button variant="outline" className="h-10 gap-2 text-sm font-medium" onClick={() => toast.info("Additional filters coming soon")}>
          <SlidersHorizontal className="h-4 w-4" /> More Filters
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Today's Listings</h2>
            <Badge className="bg-success/10 text-success border-success/20 text-[10px] font-bold tracking-wider">LIVE</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-sm gap-2 text-muted-foreground hover:text-foreground" onClick={() => {
              // Generate a simple PDF (simulate with text file for demo)
              const content = filtered.map(item => `Case: ${item.caseNumber}\nCourt: ${item.court}\nPetitioner: ${item.parties.petitioner}\nRespondent: ${item.parties.respondent}\nStatus: ${item.status}\n`).join("\n---\n");
              const blob = new Blob([content], { type: "application/pdf" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "cause-list.pdf";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="ghost" size="sm" className="text-sm gap-2 text-muted-foreground hover:text-foreground" onClick={() => {
              // Generate CSV
              const header = "Case Number,Court,Petitioner,Respondent,Court Hall,Item,Bench,Status";
              const rows = filtered.map(item => [
                item.caseNumber,
                item.court,
                item.parties.petitioner,
                item.parties.respondent,
                item.courtHall,
                item.item,
                '"' + item.bench.replace(/"/g, '""') + '"',
                item.status
              ].join(",")).join("\n");
              const csv = header + "\n" + rows;
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "cause-list.csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}>
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="table-header text-left px-6 py-3">Case Number</th>
                <th className="table-header text-left px-4 py-3">Parties</th>
                <th className="table-header text-left px-4 py-3">Court / Hall</th>
                <th className="table-header text-center px-4 py-3">Item</th>
                <th className="table-header text-left px-4 py-3">Bench</th>
                <th className="table-header text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setViewOpen(i)}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-primary">{item.caseNumber}</p>
                    <p className="text-[10px] font-semibold tracking-wider text-primary/60 uppercase mt-0.5">{item.court}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-foreground">{item.parties.petitioner} <span className="text-muted-foreground italic text-xs">vs</span></p>
                    <p className="text-sm text-foreground">{item.parties.respondent}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">{item.courtHall}</p>
                    {item.hallDetail && <p className="text-xs text-muted-foreground">{item.hallDetail}</p>}
                  </td>
                  <td className="px-4 py-4 text-center"><span className="text-sm font-bold text-foreground">{item.item}</span></td>
                  <td className="px-4 py-4"><p className="text-xs text-foreground leading-relaxed max-w-[200px]">{item.bench}</p></td>
                  <td className="px-4 py-4 text-center"><span className={getStatusClass(item.status)}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-border">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} of {listings.length} listings</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" className="h-8 w-8 bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="icon" className="h-8 w-8">2</Button>
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen !== null} onOpenChange={(v) => !v && setViewOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Case Listing Details</DialogTitle></DialogHeader>
          {viewOpen !== null && (
            <div className="space-y-3 pt-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground text-xs">Case Number</p><p className="text-foreground font-bold text-primary">{filtered[viewOpen].caseNumber}</p></div>
                <div><p className="text-muted-foreground text-xs">Court</p><p className="text-foreground">{filtered[viewOpen].court}</p></div>
                <div><p className="text-muted-foreground text-xs">Petitioner</p><p className="text-foreground">{filtered[viewOpen].parties.petitioner}</p></div>
                <div><p className="text-muted-foreground text-xs">Respondent</p><p className="text-foreground">{filtered[viewOpen].parties.respondent}</p></div>
                <div><p className="text-muted-foreground text-xs">Court Hall</p><p className="text-foreground">{filtered[viewOpen].courtHall}</p></div>
                <div><p className="text-muted-foreground text-xs">Item No.</p><p className="text-foreground font-bold">{filtered[viewOpen].item}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs">Bench</p><p className="text-foreground">{filtered[viewOpen].bench}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p><span className={getStatusClass(filtered[viewOpen].status)}>{filtered[viewOpen].status}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-6 bg-card rounded-xl border border-border p-4 max-w-xs" style={{ boxShadow: "var(--card-shadow)" }}>
        <p className="table-header mb-3">Sync Status</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Supreme Court</span>
            <span className="flex items-center gap-1.5 text-success text-xs font-medium"><span className="h-2 w-2 rounded-full bg-success" /> Connected</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Madras HC</span>
            <span className="flex items-center gap-1.5 text-warning text-xs font-medium"><span className="h-2 w-2 rounded-full bg-warning animate-pulse" /> Syncing...</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CauseList;
