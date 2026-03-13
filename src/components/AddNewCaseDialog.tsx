import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Shield, FileText, Users, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddNewCaseDialogProps {
  trigger?: React.ReactNode;
  onAddCase?: (newCase: any) => void;
}

export function AddNewCaseDialog({ trigger, onAddCase }: AddNewCaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Case Details
  const [caseNumber, setCaseNumber] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseType, setCaseType] = useState("");

  // Court & Schedule
  const [court, setCourt] = useState("");
  const [judge, setJudge] = useState("");
  const [hearing, setHearing] = useState("");

  // Parties
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [advocateName, setAdvocateName] = useState("");
  const [advocatePhone, setAdvocatePhone] = useState("");

  const steps = [
    { num: 1, label: "Case Details", icon: <FileText className="h-4 w-4" /> },
    { num: 2, label: "Court & Schedule", icon: <Shield className="h-4 w-4" /> },
    { num: 3, label: "Parties & Contact", icon: <Users className="h-4 w-4" /> },
  ];

  const handleComplete = () => {
    if (!caseNumber || !clientName || !clientPhone) {
      toast.error("Please fill in Case Number, Client Name, and Client Phone.");
      return;
    }
    if (onAddCase) {
      onAddCase({
        number: caseNumber,
        title: caseTitle,
        type: caseType,
        court,
        judge,
        judgeInit: judge.split(" ").map((w) => w[0]).join("").toUpperCase(),
        hearing,
        clientName,
        clientPhone,
        advocateName,
        advocatePhone,
        notification_status: "pending",
        status: "Active",
      });
    }
    setOpen(false);
    setStep(1);
    toast.success("Case created successfully!");
    // Reset
    setCaseNumber(""); setCaseTitle(""); setCaseType("");
    setCourt(""); setJudge(""); setHearing("");
    setClientName(""); setClientPhone(""); setAdvocateName(""); setAdvocatePhone("");
  };

  const handleClose = () => { setOpen(false); setStep(1); };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(1); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-primary-foreground font-semibold text-sm gap-2">
            <Plus className="h-4 w-4" /> Add New Case
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Case</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${step === s.num ? "bg-primary/10 text-primary border border-primary/20" :
                  step > s.num ? "bg-success/10 text-success border border-success/20" :
                    "bg-secondary text-muted-foreground border border-transparent"
                }`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s.num ? "bg-primary text-primary-foreground" :
                    step > s.num ? "bg-success text-white" :
                      "bg-muted-foreground/20 text-muted-foreground"
                  }`}>{step > s.num ? "✓" : s.num}</div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 1: Case Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div><Label>Case Title</Label><Input placeholder="e.g. State vs. John Doe" className="mt-1.5" value={caseTitle} onChange={e => setCaseTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Case Number <span className="text-destructive">*</span></Label><Input placeholder="CAS-2024-00129" className="mt-1.5" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} /></div>
              <div><Label>Case Type</Label>
                <Select value={caseType} onValueChange={setCaseType}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Civil Litigation">Civil Litigation</SelectItem>
                    <SelectItem value="Criminal Defense">Criminal Defense</SelectItem>
                    <SelectItem value="Family Law">Family Law</SelectItem>
                    <SelectItem value="Intellectual Property">Intellectual Property</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure Storage</span>
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Auto-filing</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Team Access</span>
            </div>
          </div>
        )}

        {/* Step 2: Court & Schedule */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Court Type</Label>
                <Select><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select court type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supreme">Supreme Court</SelectItem>
                    <SelectItem value="high">High Court</SelectItem>
                    <SelectItem value="district">District Court</SelectItem>
                    <SelectItem value="family">Family Court</SelectItem>
                    <SelectItem value="federal">Federal Court</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Court Name</Label><Input placeholder="e.g. Superior Court, Division 4" className="mt-1.5" value={court} onChange={e => setCourt(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Bench / Judge Name</Label><Input placeholder="e.g. Hon. Maria G." className="mt-1.5" value={judge} onChange={e => setJudge(e.target.value)} /></div>
              <div><Label>Court Hall Number</Label><Input placeholder="e.g. Court 12" className="mt-1.5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Initial Hearing Date</Label><Input type="date" className="mt-1.5" /></div>
              <div><Label>Next Hearing Date</Label><Input type="date" className="mt-1.5" value={hearing} onChange={e => setHearing(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Case Stage</Label>
                <Select><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admission">Admission</SelectItem>
                    <SelectItem value="evidence">Evidence</SelectItem>
                    <SelectItem value="arguments">Arguments</SelectItem>
                    <SelectItem value="judgement">Judgement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <div className="flex gap-2 mt-1.5">
                  {['Regular', 'High', 'Urgent'].map(p => (
                    <Button key={p} variant="outline" size="sm" className="flex-1 text-xs">{p}</Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Parties & Contact */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Client Info */}
            <div className="rounded-xl border border-border p-4 bg-secondary/30 space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Client Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. Ravi Kumar" className="mt-1.5" value={clientName} onChange={e => setClientName(e.target.value)} />
                </div>
                <div>
                  <Label>Client Phone <span className="text-destructive">*</span></Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="+91 9876543210" className="pl-9" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Format: +CountryCode Number (e.g. +919876543210)</p>
                </div>
              </div>
            </div>

            {/* Advocate Info */}
            <div className="rounded-xl border border-border p-4 bg-secondary/30 space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Advocate Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Advocate Name</Label>
                  <Input placeholder="e.g. Adv. Prasanna" className="mt-1.5" value={advocateName} onChange={e => setAdvocateName(e.target.value)} />
                </div>
                <div>
                  <Label>Advocate Phone (for reminders)</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="+91 9876543210" className="pl-9" value={advocatePhone} onChange={e => setAdvocatePhone(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Opposing Party */}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Petitioner / Appellant</Label><Input placeholder="Enter petitioner name" className="mt-1.5" /></div>
              <div><Label>Respondent</Label><Input placeholder="Enter respondent name" className="mt-1.5" /></div>
            </div>

            {/* Upload section */}
            <div>
              <Label>Upload Documents</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center mt-1.5">
                <Upload className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Drag & drop files here</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG (Max 50MB)</p>
                <Button variant="outline" size="sm" className="mt-3">Browse Files</Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            {step < 3 ? (
              <>
                <Button variant="outline" onClick={() => toast.info("Draft saved")}>Save as Draft</Button>
                <Button onClick={() => setStep(step + 1)}>Next Step</Button>
              </>
            ) : (
              <Button onClick={handleComplete}>Complete Case Setup</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
