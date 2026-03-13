import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { BarChart3, Briefcase, CheckCircle2, Clock, TrendingUp, Users, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const [totalCases, setTotalCases] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const casesQ = query(collection(db, "cases"), where("userId", "==", user.uid));
    const clientsQ = query(collection(db, "clients"), where("userId", "==", user.uid));
    const eventsQ = query(collection(db, "events"), where("userId", "==", user.uid));
    const docsQ = query(collection(db, "documents"), where("userId", "==", user.uid));

    const unsubCases = onSnapshot(casesQ, (snap) => {
      setTotalCases(snap.size);
      // Get the 3 most recently added cases for the timeline
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setRecentCases(sorted.slice(0, 4));
    });

    const unsubClients = onSnapshot(clientsQ, (snap) => {
      setTotalClients(snap.size);
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setRecentClients(sorted.slice(0, 2));
    });

    const unsubEvents = onSnapshot(eventsQ, (snap) => {
      setTotalEvents(snap.size);
      const today = new Date().toISOString().split("T")[0];
      const upcoming = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((e: any) => e.dateKey >= today)
        .sort((a: any, b: any) => (a.dateKey || "").localeCompare(b.dateKey || ""));
      setUpcomingEvents(upcoming.slice(0, 4));
    });

    const unsubDocs = onSnapshot(docsQ, (snap) => setTotalDocuments(snap.size));

    return () => { unsubCases(); unsubClients(); unsubEvents(); unsubDocs(); };
  }, [user]);

  // Build recent activity feed by merging cases and clients
  const activityFeed = [
    ...recentCases.map((c: any) => ({
      icon: <Briefcase className="h-4 w-4 text-primary" />,
      text: `Case ${c.number || c.caseNumber || c.title} added`,
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recently",
      key: "case-" + c.id
    })),
    ...recentClients.map((c: any) => ({
      icon: <Users className="h-4 w-4 text-info" />,
      text: `Client ${c.name} added`,
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recently",
      key: "client-" + c.id
    })),
  ].slice(0, 5);

  const typeColors: Record<string, string> = {
    hearing: "text-primary",
    meeting: "text-success",
    deadline: "text-destructive",
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of your legal practice">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Cases"
          value={totalCases.toString()}
          trend={totalCases > 0 ? `${totalCases} total` : "No cases yet"}
          trendType="positive"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          title="Total Clients"
          value={totalClients.toString()}
          trend={totalClients > 0 ? `${totalClients} registered` : "No clients yet"}
          trendType="positive"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Upcoming Hearings"
          value={totalEvents.toString()}
          description={totalEvents > 0 ? "Across all cases" : "None scheduled"}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Documents Filed"
          value={totalDocuments.toString()}
          trend={totalDocuments > 0 ? `${totalDocuments} on file` : "None uploaded"}
          trendType="positive"
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-base font-bold text-foreground mb-4">Recent Activity</h2>
          {activityFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add cases or clients to see activity here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityFeed.map((item, i) => (
                <div key={item.key} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="mt-0.5">{item.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Hearings */}
        <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-base font-bold text-foreground mb-4">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
              <p className="text-xs text-muted-foreground mt-1">Add events from the Calendar page.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((h: any, i) => {
                const isToday = h.dateKey === new Date().toISOString().split("T")[0];
                return (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{h.title}</p>
                      <p className="text-xs text-muted-foreground">{h.caseId || "No case linked"} · {h.time}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isToday ? "text-destructive" : "text-foreground"}`}>
                        {isToday ? "Today" : h.dateKey}
                      </p>
                      <p className={`text-[10px] uppercase tracking-wider ${typeColors[h.type] || "text-muted-foreground"}`}>{h.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
