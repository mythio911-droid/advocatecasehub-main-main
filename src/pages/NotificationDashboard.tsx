import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Bell, Send, Search, Filter, CheckCircle2, XCircle, Clock, MessageSquare,
    RefreshCw, Phone, Calendar, AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
    collection, onSnapshot, query, where, orderBy,
    updateDoc, doc
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { sendCaseReminder, isHearingTomorrow } from "@/lib/twilioService";

const NotificationDashboard = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [sending, setSending] = useState<string | null>(null);
    const [sendingAll, setSendingAll] = useState(false);
    const { user } = useAuth();

    // Load notifications
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("sent_at", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, (err) => {
            console.error("Notifications error:", err);
        });
        return () => unsub();
    }, [user]);

    // Load cases for upcoming hearings
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "cases"), where("userId", "==", user.uid));
        const unsub = onSnapshot(q, (snap) => {
            setCases(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user]);

    const tomorrowCases = cases.filter((c) => c.hearing && isHearingTomorrow(c.hearing));

    const handleSendReminder = async (caseData: any) => {
        if (!user) return;
        setSending(caseData.id);
        try {
            const result = await sendCaseReminder(caseData, user.uid);
            if (result.clientResult.success) {
                toast.success(`✅ Reminder sent to ${caseData.clientName || "client"}!`);
                // Mark case notification_status as sent
                await updateDoc(doc(db, "cases", caseData.id), { notification_status: "sent" });
            } else {
                toast.error(`❌ Failed: ${result.clientResult.error}`);
            }
        } catch (err: any) {
            toast.error("Error sending reminder: " + err.message);
        } finally {
            setSending(null);
        }
    };

    const handleSendAllReminders = async () => {
        if (!user || tomorrowCases.length === 0) return;
        setSendingAll(true);
        let successCount = 0;
        let failCount = 0;
        for (const caseData of tomorrowCases) {
            try {
                const result = await sendCaseReminder(caseData, user.uid);
                if (result.clientResult.success) {
                    successCount++;
                    await updateDoc(doc(db, "cases", caseData.id), { notification_status: "sent" });
                } else {
                    failCount++;
                }
            } catch {
                failCount++;
            }
        }
        setSendingAll(false);
        if (successCount > 0) toast.success(`✅ Sent ${successCount} reminder(s) successfully!`);
        if (failCount > 0) toast.error(`❌ ${failCount} reminder(s) failed.`);
    };

    // Filter notifications
    const filtered = notifications.filter((n) => {
        const matchSearch =
            !search ||
            n.caseNumber?.toLowerCase().includes(search.toLowerCase()) ||
            n.clientName?.toLowerCase().includes(search.toLowerCase()) ||
            n.phone_number?.includes(search);
        const matchDate =
            !filterDate ||
            (n.sent_at?.toDate
                ? n.sent_at.toDate().toISOString().startsWith(filterDate)
                : false);
        return matchSearch && matchDate;
    });

    const sentCount = notifications.filter((n) => n.status === "sent").length;
    const failedCount = notifications.filter((n) => n.status === "failed").length;
    const pendingCount = cases.filter((c) => c.notification_status === "pending").length;

    return (
        <DashboardLayout
            title="Notification Dashboard"
            subtitle="Manage court hearing reminders via Twilio SMS"
            actions={
                <Button
                    onClick={handleSendAllReminders}
                    disabled={sendingAll || tomorrowCases.length === 0}
                    className="bg-primary text-primary-foreground font-semibold text-sm gap-2"
                >
                    {sendingAll ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    {sendingAll ? "Sending..." : `Send All Tomorrow's Reminders (${tomorrowCases.length})`}
                </Button>
            }
        >
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="stat-card flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
                    <div>
                        <p className="table-header">Sent</p>
                        <p className="text-2xl font-bold text-foreground">{sentCount}</p>
                    </div>
                </div>
                <div className="stat-card flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-destructive shrink-0" />
                    <div>
                        <p className="table-header">Failed</p>
                        <p className="text-2xl font-bold text-foreground">{failedCount}</p>
                    </div>
                </div>
                <div className="stat-card flex items-center gap-3">
                    <Clock className="h-8 w-8 text-warning shrink-0" />
                    <div>
                        <p className="table-header">Pending</p>
                        <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                    </div>
                </div>
                <div className="stat-card flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-primary shrink-0" />
                    <div>
                        <p className="table-header">Tomorrow</p>
                        <p className="text-2xl font-bold text-foreground">{tomorrowCases.length}</p>
                    </div>
                </div>
            </div>

            {/* Tomorrow's Hearings */}
            {tomorrowCases.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <h3 className="text-sm font-bold text-foreground">Cases Scheduled for Tomorrow</h3>
                        <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">{tomorrowCases.length} Pending</Badge>
                    </div>
                    <div className="space-y-2">
                        {tomorrowCases.map((c) => (
                            <div
                                key={c.id}
                                className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                                        <Bell className="h-5 w-5 text-warning" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-foreground">{c.number}</p>
                                        <p className="text-xs text-muted-foreground truncate">{c.title}</p>
                                    </div>
                                    <div className="hidden md:block min-w-0">
                                        <p className="text-xs text-muted-foreground">Client</p>
                                        <p className="text-sm font-medium text-foreground">{c.clientName || "—"}</p>
                                    </div>
                                    <div className="hidden md:block min-w-0">
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" />{c.clientPhone || "—"}
                                        </p>
                                    </div>
                                    <div className="hidden lg:block min-w-0">
                                        <p className="text-xs text-muted-foreground">Court</p>
                                        <p className="text-sm text-foreground truncate">{c.court || "—"}</p>
                                    </div>
                                    <div>
                                        <Badge variant={c.notification_status === "sent" ? "default" : "secondary"}
                                            className={c.notification_status === "sent"
                                                ? "bg-success/10 text-success border-success/20 text-xs"
                                                : "bg-warning/10 text-warning border-warning/20 text-xs"
                                            }>
                                            {c.notification_status === "sent" ? "✓ Sent" : "Pending"}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleSendReminder(c)}
                                    disabled={sending === c.id || c.notification_status === "sent"}
                                    className="gap-2 shrink-0"
                                >
                                    {sending === c.id ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Send className="h-3.5 w-3.5" />
                                    )}
                                    {sending === c.id ? "Sending..." : c.notification_status === "sent" ? "Sent" : "Send Reminder"}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by case number, client name, or phone..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        className="pl-9 w-44"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                {(search || filterDate) && (
                    <Button variant="outline" onClick={() => { setSearch(""); setFilterDate(""); }} size="sm">
                        Clear
                    </Button>
                )}
            </div>

            {/* Notifications Log */}
            <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Notification Log</h3>
                    <Badge variant="secondary" className="text-xs ml-auto">{filtered.length} records</Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="table-header text-left px-6 py-3">Case #</th>
                                <th className="table-header text-left px-4 py-3">Recipient</th>
                                <th className="table-header text-left px-4 py-3">Phone</th>
                                <th className="table-header text-left px-4 py-3">Type</th>
                                <th className="table-header text-left px-4 py-3">Status</th>
                                <th className="table-header text-left px-4 py-3">Sent At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">No notifications found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Reminders will appear here once sent</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((n) => (
                                    <tr key={n.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-foreground">{n.caseNumber}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-foreground">{n.clientName || "—"}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3 text-muted-foreground" />{n.phone_number}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {n.recipient_type || "client"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4">
                                            {n.status === "sent" ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                                                    <XCircle className="h-3.5 w-3.5" /> Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs text-muted-foreground">
                                                {n.sent_at?.toDate
                                                    ? n.sent_at.toDate().toLocaleString("en-IN", {
                                                        day: "2-digit", month: "short", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit"
                                                    })
                                                    : "—"}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NotificationDashboard;
