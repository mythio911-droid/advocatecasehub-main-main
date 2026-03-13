import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const SettingsPage = () => {
  // User profile state
  const [profile, setProfile] = useState({
    name: "Your name",
    email: "your.email@lawfirm.com",
    phone: "+91 ",
    role: "partner",
    firm: "",
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as any);
      } else {
        // Automatically seed the default user document if it doesn't exist
        const initialProfile = {
            name: user.displayName || "Advocate Name",
            email: user.email || "advocate@lawfirm.com",
            phone: user.phoneNumber || "+91 9876543210",
            role: "partner",
            firm: "Justice Law Firm"
        };
        try {
            await setDoc(docRef, initialProfile);
            setProfile(initialProfile);
            console.log(`Seeded ${user.uid} profile.`);
        } catch (e) {
            console.error("Error creating default profile", e);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading profile:", err);
      toast.error("Failed to load profile data");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, profile, { merge: true });
      toast.success("Profile updated successfully on Firestore");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to save profile");
    }
  };

  return (
    <DashboardLayout user={profile}>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6" style={{ boxShadow: "var(--card-shadow)" }}>
            <h3 className="text-base font-bold text-foreground">Profile Information</h3>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">
                  {profile.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </span>
              </div>
              <div>
                <Button variant="outline" size="sm">Change Avatar</Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 2MB</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profile.name}
                  onChange={e => handleChange("name", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={profile.email}
                  onChange={e => handleChange("email", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={profile.phone}
                  onChange={e => handleChange("phone", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={profile.role} onValueChange={v => handleChange("role", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partner">Senior Partner</SelectItem>
                    <SelectItem value="associate">Associate</SelectItem>
                    <SelectItem value="paralegal">Paralegal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Firm Name</Label>
                <Input
                  value={profile.firm}
                  onChange={e => handleChange("firm", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6" style={{ boxShadow: "var(--card-shadow)" }}>
            <h3 className="text-base font-bold text-foreground">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { label: "Hearing Reminders", desc: "Get notified 24 hours before hearings", default: true },
                { label: "Cause List Updates", desc: "Daily cause list match notifications", default: true },
                { label: "Bench Changes", desc: "Alert when bench is changed for your cases", default: true },
                { label: "Client Messages", desc: "Notify on new client communications", default: false },
                { label: "Document Uploads", desc: "Alert when team uploads documents", default: false },
                { label: "Weekly Digest", desc: "Weekly summary of all activities", default: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.default} onCheckedChange={(v) => toast.success(`${item.label} ${v ? "enabled" : "disabled"}`)} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6" style={{ boxShadow: "var(--card-shadow)" }}>
            <h3 className="text-base font-bold text-foreground">Security Settings</h3>
            <div className="space-y-4">
              <div><Label>Current Password</Label><Input type="password" placeholder="Enter current password" className="mt-1.5 max-w-md" /></div>
              <div><Label>New Password</Label><Input type="password" placeholder="Enter new password" className="mt-1.5 max-w-md" /></div>
              <div><Label>Confirm Password</Label><Input type="password" placeholder="Confirm new password" className="mt-1.5 max-w-md" /></div>
              <Button onClick={() => toast.success("Password updated successfully")}>Update Password</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch onCheckedChange={(v) => toast.success(`2FA ${v ? "enabled" : "disabled"}`)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6" style={{ boxShadow: "var(--card-shadow)" }}>
            <h3 className="text-base font-bold text-foreground">Billing & Subscription</h3>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Premium Suite</p>
                  <p className="text-xs text-muted-foreground">Billed annually · Renews Jan 2025</p>
                </div>
                <p className="text-2xl font-bold text-primary">₹24,999<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Storage</span><span className="text-foreground font-medium">4.2 GB / 10 GB</span></div>
              <div className="w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: "42%" }} /></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Team Members</span><span className="text-foreground font-medium">24 / 50</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cases</span><span className="text-foreground font-medium">128 / Unlimited</span></div>
            </div>
            <Button variant="outline" onClick={() => toast.info("Redirecting to billing portal...")}>Manage Subscription</Button>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SettingsPage;
