import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { toast } from "sonner";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const typeColors: Record<string, string> = {
  hearing: "bg-primary/10 text-primary border-primary/20",
  meeting: "bg-success/10 text-success border-success/20",
  deadline: "bg-destructive/10 text-destructive border-destructive/20",
};

const checklist = [
  { task: "Print Exhibits A-F", done: true },
  { task: "Coordinate with Co-Counsel", done: false },
  { task: "Verify Affidavit Signatures", done: false },
  { task: "Prepare Opening Statement", done: true },
];

const CalendarPage = () => {
  const { user } = useAuth();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [checklistState, setChecklistState] = useState(checklist.map(c => c.done));

  const [events, setEvents] = useState<{ [key: string]: { id: string; title: string; type: string; time: string; caseId?: string }[] }>({});

  // New event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventCase, setEventCase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "events"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbEvents: { [key: string]: any[] } = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!dbEvents[data.dateKey]) {
          dbEvents[data.dateKey] = [];
        }
        dbEvents[data.dateKey].push({ id: doc.id, ...data });
      });
      // Sort events by time within each day
      Object.keys(dbEvents).forEach(key => {
        dbEvents[key].sort((a, b) => a.time.localeCompare(b.time));
      });
      setEvents(dbEvents);
    }, (error) => {
      console.error("Error fetching events:", error);
      toast.error("Failed to load calendar events");
    });
    return () => unsubscribe();
  }, [user]);

  // Calculate days in month and first day offset
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOffset; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(1);
  };

  const toggleChecklist = (idx: number) => {
    const updated = [...checklistState];
    updated[idx] = !updated[idx];
    setChecklistState(updated);
    toast.success(updated[idx] ? "Task completed" : "Task unchecked");
  };

  const handleAddEvent = async () => {
    if (!eventTitle || !eventTime || !eventType || !user) {
      toast.error("Please fill all event fields");
      return;
    }
    setIsSubmitting(true);
    try {
      let key = eventDate;
      let dayNum = selectedDay;
      let monthNum = currentMonth + 1;
      let yearNum = currentYear;

      if (!key) {
        key = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      } else {
        const [y, m, d] = key.split("-").map(Number);
        yearNum = y;
        monthNum = m;
        dayNum = d;
        setCurrentYear(y);
        setCurrentMonth(m - 1);
      }

      await addDoc(collection(db, "events"), {
        userId: user.uid,
        title: eventTitle,
        type: eventType,
        time: eventTime,
        dateKey: key,
        caseId: eventCase || "",
        createdAt: new Date().toISOString()
      });

      setSelectedDay(dayNum);
      setNewEventOpen(false);
      setEventTitle("");
      setEventDate("");
      setEventTime("");
      setEventType("");
      setEventCase("");
      toast.success("Event added to calendar");
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const currentAgendaItems = events[selectedDateKey] || [];

  return (
    <DashboardLayout
      title="Court Calendar"
      subtitle="Manage hearings, deadlines, and team events"
      actions={
        <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-semibold text-sm gap-2">
              <Plus className="h-4 w-4" /> New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add New Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Event Title</Label><Input placeholder="e.g. Hearing - Smith vs. Smith" className="mt-1.5" value={eventTitle} onChange={e => setEventTitle(e.target.value)} disabled={isSubmitting} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input type="date" className="mt-1.5" value={eventDate} onChange={e => setEventDate(e.target.value)} disabled={isSubmitting} /></div>
                <div><Label>Time</Label><Input type="time" className="mt-1.5" value={eventTime} onChange={e => setEventTime(e.target.value)} disabled={isSubmitting} /></div>
              </div>
              <div><Label>Event Type</Label>
                <Select value={eventType} onValueChange={setEventType} disabled={isSubmitting}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hearing">Court Hearing</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Related Case</Label>
                <Input placeholder="Enter case optionally" className="mt-1.5" value={eventCase} onChange={e => setEventCase(e.target.value)} disabled={isSubmitting} />
              </div>
              <div><Label>Notes</Label><Textarea placeholder="Add notes..." className="mt-1.5" disabled={isSubmitting} /></div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setNewEventOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleAddEvent} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Event"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="px-6 py-4 flex items-center justify-between border-b border-border">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-bold text-foreground">{monthNames[currentMonth]} {currentYear}</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} className="min-h-[80px] p-1.5 rounded-lg" />;
                const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                return (
                  <div key={i} onClick={() => setSelectedDay(day)} className={`min-h-[80px] p-1.5 rounded-lg border transition-colors cursor-pointer ${day === selectedDay ? "border-primary bg-primary/5" : day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear() ? "border-foreground/30 bg-foreground/5" : "border-transparent hover:bg-secondary/50"}`}>
                    <span className={`text-xs font-semibold ${day === selectedDay ? "text-primary" : "text-foreground"}`}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {(events[key] || []).map((e, j) => (
                        <div key={j} className={`text-[9px] font-medium px-1 py-0.5 rounded truncate border ${typeColors[e.type]}`}>{e.title}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Daily Agenda */}
          <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--card-shadow)" }}>
            <h3 className="text-sm font-bold text-foreground mb-1">Daily Agenda</h3>
            <p className="text-xs text-muted-foreground mb-4">{selectedDay ? `${monthNames[currentMonth]} ${selectedDay}, ${currentYear}` : "Select a day"}</p>
            <div className="space-y-3">
              {currentAgendaItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events scheduled.</p>
              ) : (
                currentAgendaItems.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="w-px h-full bg-border mt-1" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-xs font-semibold text-muted-foreground">{item.time}</p>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      {item.caseId && <Badge variant="outline" className="text-[10px] mt-1">{item.caseId}</Badge>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Prep Checklist */}
          <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--card-shadow)" }}>
            <h3 className="text-sm font-bold text-foreground mb-3">Prep Checklist</h3>
            <div className="space-y-2.5">
              {checklist.map((item, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleChecklist(i)}>
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${checklistState[i] ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                    }`}>
                    {checklistState[i] && <span className="text-primary-foreground text-[10px]">✓</span>}
                  </div>
                  <span className={`text-sm ${checklistState[i] ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.task}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
