
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Trash2, FileText, UploadCloud, File, AlertCircle, Loader2, Link as LinkIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Resource {
    id: string;
    fileName: string;
    type: string;
    url?: string;
    createdAt: string;
    metadata?: {
        size?: number;
        pageCount?: number;
    };
}

export function ResourceManager() {
    const params = useParams();
    const courseId = params.id as string;
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Resources
    const fetchResources = async () => {
        try {
            const res = await fetch(`/api/course/${courseId}/resources`);
            if (res.ok) {
                const data = await res.json();
                setResources(data);
            }
        } catch (error) {
            console.error("Failed to load resources", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [courseId]);

    // Handle Upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error("File is too large. Max 10MB.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setIsUploading(true);
        const toastId = toast.loading("Uploading and processing...");

        try {
            const res = await fetch(`/api/course/${courseId}/resources/upload`, {
                method: "POST",
                body: formData, // No headers, browser sets multipart
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Upload failed");
            }

            toast.success("File uploaded and indexed!", { id: toastId });
            fetchResources(); // Refresh list
        } catch (error: any) {
            console.error(error);
            toast.error(error.message, { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Handle Delete
    const handleDelete = async (resourceId: string) => {
        if (!confirm("Are you sure? This will remove the file from the Knowledge Base.")) return;

        const toastId = toast.loading("Deleting...");
        try {
            const res = await fetch(`/api/course/${courseId}/resources/${resourceId}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Delete failed");

            setResources(prev => prev.filter(r => r.id !== resourceId));
            toast.success("Deleted", { id: toastId });
        } catch (error) {
            toast.error("Failed to delete", { id: toastId });
        }
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return "Unknown";
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        Course Resources
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage files used by the AI to generate content.
                    </p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.txt,.md"
                        onChange={handleFileSelect}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                    >
                        {isUploading ? <Loader2 className="animate-spin size-4" /> : <UploadCloud className="size-4" />}
                        Upload File
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="border border-border rounded-xl bg-card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-muted-foreground" />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                        <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
                            <UploadCloud className="size-8 opacity-50" />
                        </div>
                        <div>
                            <p className="font-medium">No resources yet</p>
                            <p className="text-sm">Upload PDF textbooks or notes to enhance accuracy.</p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">Added</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {resources.map((res) => (
                                <tr key={res.id} className="group hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                                        <div className={cn(
                                            "size-8 rounded items-center justify-center flex shrink-0",
                                            res.type === 'pdf' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                                        )}>
                                            <File className="size-4" />
                                        </div>
                                        <div className="truncate max-w-[200px]" title={res.fileName}>
                                            {res.fileName || "Untitled"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        <div className="flex flex-col text-xs">
                                            <span className="uppercase font-semibold">{res.type}</span>
                                            <span>{formatSize(res.metadata?.size)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(res.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {res.url && (
                                                <a href={res.url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon" title="View Original">
                                                        <Download className="size-4" />
                                                    </Button>
                                                </a>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(res.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
