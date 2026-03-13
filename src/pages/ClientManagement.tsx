import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Plus, Search, ChevronLeft, ChevronRight, Users, Eye, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const filters = ["All Clients", "Active", "Leads", "Corporate"];

const getStatusClass = (s: string) => {
  if (s === "Active") return "status-active";
  if (s === "Lead") return "status-lead";
  return "status-inactive";
};

const ClientManagement = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [viewClientOpen, setViewClientOpen] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "clients"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({
            firebaseId: doc.id,
            ...doc.data()
        }));
        setClients(clientsData);
    }, (error) => {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
    });
    return () => unsubscribe();
  }, [user]);


  let filteredClients = clients.filter(c => {
    if (activeFilter === 1) return c.status === "Active";
    if (activeFilter === 2) return c.status === "Lead";
    if (activeFilter === 3) return c.tags && c.tags.includes("CORPORATE");
    return true;
  });
  if (searchQuery) {
    filteredClients = filteredClients
      .map((client, idx) => ({ client, idx }))
      .sort((a, b) => {
        // Prioritize client name match, then email match, then original order
        const aName = a.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 0 : 1;
        const bName = b.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 0 : 1;
        if (aName !== bName) return aName - bName;
        const aEmail = a.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ? 0 : 1;
        const bEmail = b.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ? 0 : 1;
        if (aEmail !== bEmail) return aEmail - bEmail;
        return a.idx - b.idx;
      })
      .map(x => x.client)
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  // Add client form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientType, setClientType] = useState("");
  const [status, setStatus] = useState("lead");

  const handleAddClient = async () => {
    if (!user) {
      toast.error("You must be logged in to add a client");
      return;
    }
    if (!firstName || !lastName || !email || !phone || !clientType || !status) {
      toast.error("Please fill all fields");
      return;
    }
    const newClient = {
      name: `${firstName} ${lastName}`,
      id: `#CL-${Math.floor(Math.random() * 90000) + 10000}`,
      email,
      phone,
      cases: 0,
      tags: [clientType.toUpperCase()],
      revenue: "$0.00",
      lastDate: "NEVER",
      status: status.charAt(0).toUpperCase() + status.slice(1),
      userId: user.uid
    };
    try {
        await addDoc(collection(db, "clients"), newClient);
        setAddClientOpen(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setClientType("");
        setStatus("lead");
        toast.success("Client added successfully to Firebase");
    } catch (error) {
        console.error("Error adding client: ", error);
        toast.error("Failed to add client");
    }
  };

  const handleDeleteClient = async (firebaseId: string) => {
    try {
        await deleteDoc(doc(db, "clients", firebaseId));
        toast.success("Client deleted from Firebase");
    } catch (error) {
        console.error("Error deleting client: ", error);
        toast.error("Failed to delete client");
    }
  };

  return (
    <DashboardLayout
      title="Client Management"
      subtitle="Manage legal practice and client relationships with precision."
      actions={
        <>
          {/* Export List button removed */}
          <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-semibold text-sm gap-2"><Plus className="h-4 w-4" /> Add New Client</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>First Name</Label><Input placeholder="Enter first name" className="mt-1.5" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                    <div><Label>Last Name</Label><Input placeholder="Enter last name" className="mt-1.5" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                  </div>
                  <div><Label>Email Address</Label><Input type="email" placeholder="name@firm.com" className="mt-1.5" value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div><Label>Phone Number</Label><Input placeholder="+1 (555) 000-0000" className="mt-1.5" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                  <div><Label>Client Type</Label>
                    <Select value={clientType} onValueChange={setClientType}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setAddClientOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddClient}>Add Client</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Clients" value={clients.length.toString()} trend={clients.length > 0 ? `${clients.length} registered` : "No clients yet"} trendType="positive" icon={<Users className="h-5 w-5" />} />
        <StatCard title="Active Clients" value={clients.filter(c => c.status === 'Active').length.toString()} trend={clients.length > 0 ? `${Math.round(clients.filter(c => c.status === 'Active').length / Math.max(clients.length, 1) * 100)}% Active rate` : "No data"} trendType="positive" />
        <StatCard title="Leads" value={clients.filter(c => c.status === 'Lead').length.toString()} trend={clients.filter(c => c.status === 'Lead').length > 0 ? "Awaiting conversion" : "No leads yet"} trendType={clients.filter(c => c.status === 'Lead').length > 0 ? "positive" : "neutral"} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, or case type..." className="pl-9 h-10 bg-card border-border" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {filters.map((f, i) => (
            <button key={f} onClick={() => setActiveFilter(i)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${i === activeFilter ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="table-header text-left px-6 py-3">Client Name</th>
                <th className="table-header text-left px-4 py-3">Contact Info</th>
                <th className="table-header text-center px-4 py-3">Active Cases</th>
                <th className="table-header text-left px-4 py-3">Revenue/Fees</th>
                <th className="table-header text-center px-4 py-3">Status</th>
                <th className="table-header text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-muted-foreground">{c.name.split(" ").map((n: string) => n[0]).join("")}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-foreground">{c.email}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{c.cases}</span>
                      {c.tags && c.tags.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[10px] font-semibold px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">{c.revenue}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Last: {c.lastDate}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={getStatusClass(c.status)}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${c.status === "Active" ? "bg-success" : c.status === "Lead" ? "bg-warning" : "bg-muted-foreground"}`} />
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Dialog open={viewClientOpen === i} onOpenChange={(v) => setViewClientOpen(v ? i : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader><DialogTitle>Client Profile</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">{c.name.split(" ").map((n: string) => n[0]).join("")}</span>
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{c.name}</p>
                                <p className="text-sm text-muted-foreground">{c.id}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><p className="text-muted-foreground text-xs">Email</p><p className="text-foreground">{c.email}</p></div>
                              <div><p className="text-muted-foreground text-xs">Phone</p><p className="text-foreground">{c.phone}</p></div>
                              <div><p className="text-muted-foreground text-xs">Active Cases</p><p className="text-foreground font-semibold">{c.cases}</p></div>
                              <div><p className="text-muted-foreground text-xs">Revenue</p><p className="text-foreground font-semibold">{c.revenue}</p></div>
                              <div><p className="text-muted-foreground text-xs">Status</p><p className="text-foreground">{c.status}</p></div>
                              <div><p className="text-muted-foreground text-xs">Last Activity</p><p className="text-foreground">{c.lastDate}</p></div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClient(c.firebaseId)}>
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
          <p className="text-sm text-muted-foreground uppercase tracking-wider text-xs">Showing {filteredClients.length} of {clients.length} clients</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" className="h-8 w-8 bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="icon" className="h-8 w-8">2</Button>
            <Button variant="outline" size="icon" className="h-8 w-8">3</Button>
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientManagement;
