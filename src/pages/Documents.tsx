import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Search, Download, Eye, Trash2, FolderOpen, File, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";

const getFileIcon = (type: string) => {
  if (type === "JPG" || type === "PNG" || type === "JPEG") return <Image className="h-5 w-5 text-warning" />;
  if (type === "PDF") return <FileText className="h-5 w-5 text-destructive" />;
  return <File className="h-5 w-5 text-primary" />;
};

const filters = ["All Files", "PDFs", "Documents", "Images"];

const Documents = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  
  const [previewDoc, setPreviewDoc] = useState<any|null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCase, setUploadCase] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadFile, setUploadFile] = useState<File|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "documents"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDocs(docsData);
      
      const uniqueClients = [...new Set(docsData.map(d => d.client))] as string[];
      setClients(uniqueClients);
    }, (error) => {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    });
    return () => unsubscribe();
  }, [user]);

  const handleDownload = (doc: any) => {
    const blob = new Blob([`Demo content for ${doc.name}`], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${doc.name} downloaded`);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, "documents", id));
      toast.success(`${name} deleted`);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  let filteredDocs = docs.filter(d => {
    if (activeFilter === 1) return d.type === "PDF";
    if (activeFilter === 2) return d.type === "DOCX";
    if (activeFilter === 3) return d.type === "JPG" || d.type === "JPEG" || d.type === "PNG";
    return true;
  });

  if (searchQuery) {
    filteredDocs = filteredDocs
      .filter(d => (d.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || (d.client?.toLowerCase() || "").includes(searchQuery.toLowerCase()))
      .sort((a, b) => { // Simple sort by name match
        const aName = (a.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ? 0 : 1;
        const bName = (b.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ? 0 : 1;
        return aName - bName;
      });
  }

  const handleUpload = async () => {
    if (!uploadName || !user) {
      toast.error("Please provide a name.");
      return;
    }
    
    setIsUploading(true);
    try {
      let ext = "FILE";
      let sizeMB = "0.0 MB";
      
      if (uploadFile) {
        ext = uploadFile.name.split('.').pop()?.toUpperCase() || "FILE";
        sizeMB = `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`;
        // In a real app we'd upload to Firebase Storage, for demo we just write metadata to Firestore
      }

      await addDoc(collection(db, "documents"), {
        userId: user.uid,
        name: uploadName,
        type: ext,
        case: uploadCase || "-",
        client: uploadCase || "-", // Assuming case maps roughly to client input
        size: sizeMB,
        date: new Date().toLocaleDateString(),
        category: uploadCategory || "Other",
        createdAt: new Date().toISOString()
      });

      setUploadOpen(false);
      setUploadName("");
      setUploadCase("");
      setUploadCategory("");
      setUploadFile(null);
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  return (
    <DashboardLayout
      title="Documents"
      subtitle="Manage and organize all legal documents securely"
      actions={
        <>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-semibold text-sm gap-2">
                <Upload className="h-4 w-4" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Document Name</Label>
                  <Input placeholder="Enter document name" className="mt-1.5" value={uploadName} onChange={e => setUploadName(e.target.value)} />
                </div>
                <div>
                  <Label>Related Case</Label>
                  <Input placeholder="Enter related case" className="mt-1.5" value={uploadCase} onChange={e => setUploadCase(e.target.value)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input placeholder="Enter category" className="mt-1.5" value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} />
                </div>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Drag & drop files here</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG (Max 50MB)</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()}>
                    {uploadFile ? uploadFile.name : "Browse Files"}
                  </Button>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpload}>Upload</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Documents" value={docs.length.toString()} trend={docs.length > 0 ? `${docs.length} on file` : "None yet"} trendType="positive" icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Legal Filings" value={docs.filter(d => d.category === 'Legal Filing').length.toString()} description={docs.filter(d => d.category === 'Legal Filing').length > 0 ? "Most common type" : "None yet"} />
        <StatCard title="PDF Documents" value={docs.filter(d => d.type === 'PDF').length.toString()} trend={`of ${docs.length} total`} trendType="neutral" />
        <StatCard title="Recent Uploads" value={docs.filter(d => { const date = new Date(d.createdAt || 0); const weekAgo = new Date(Date.now() - 7 * 86400000); return date > weekAgo; }).length.toString()} description="Last 7 days" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents by name or client..." className="pl-9 h-10 bg-card border-border" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
                <th className="table-header text-left px-6 py-3">Document</th>
                <th className="table-header text-left px-4 py-3">Related Case</th>
                <th className="table-header text-left px-4 py-3">Category</th>
                <th className="table-header text-left px-4 py-3">Size</th>
                <th className="table-header text-left px-4 py-3">Date</th>
                <th className="table-header text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.type)}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-primary font-medium">{doc.case}</p>
                    <p className="text-xs text-muted-foreground">{doc.client}</p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">{doc.size}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{doc.date}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPreviewDoc(doc); setPreviewOpen(true); }}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                            {/* Preview Dialog */}
                            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                              <DialogContent className="max-w-xl">
                                <DialogHeader>
                                  <DialogTitle>Preview: {previewDoc?.name}</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 flex flex-col items-center">
                                  {previewDoc?.file && (previewDoc.type === "JPG" || previewDoc.type === "JPEG" || previewDoc.type === "PNG") && (
                                    <img
                                      src={URL.createObjectURL(previewDoc.file)}
                                      alt={previewDoc.name}
                                      className="max-h-96 max-w-full rounded border"
                                      onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                    />
                                  )}
                                  {previewDoc?.file && previewDoc.type === "PDF" && (
                                    <iframe
                                      src={URL.createObjectURL(previewDoc.file)}
                                      title={previewDoc.name}
                                      className="w-full h-96 border rounded"
                                      onLoad={e => URL.revokeObjectURL((e.target as HTMLIFrameElement).src)}
                                    />
                                  )}
                                  {(!previewDoc?.file || (previewDoc.type !== "PDF" && previewDoc.type !== "JPG" && previewDoc.type !== "JPEG" && previewDoc.type !== "PNG")) && (
                                    <div className="text-center text-muted-foreground">
                                      <p className="mb-2">No preview available for this file type.</p>
                                      <p className="text-xs">File name: {previewDoc?.name}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}><Download className="h-4 w-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(doc.name)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 flex items-center justify-between border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Showing {filteredDocs.length} of 342 documents</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" className="h-8 w-8 bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="icon" className="h-8 w-8">2</Button>
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Documents;
