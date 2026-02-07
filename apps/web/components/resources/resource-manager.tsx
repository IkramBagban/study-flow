
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Trash2, FileText, UploadCloud, File, Loader2, Download, CheckCircle, BrainCircuit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Resource {
    id: string;
    fileName: string;
    type: string;
    url?: string;
    createdAt: string;
    status: "QUEUED" | "PROCESSING" | "READY" | "ERROR";
    metadata?: {
        size?: number;
        pageCount?: number;
        previewStructure?: any; // The "Golden Ticket"
    };
}

export function ResourceManager() {
    const params = useParams();
    const courseId = params.courseId as string; // Fix: params.courseId based on route
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Poll for updates if any resource is not ready
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const load = async () => {
            await fetchResources();
        };

        load();

        // Check if we need to poll
        const needsPolling = resources.some(r => r.status === "QUEUED" || r.status === "PROCESSING");

        if (needsPolling) {
            interval = setInterval(fetchResources, 2000);
        }

        return () => clearInterval(interval);
    }, [courseId, resources.map(r => r.status).join(',')]); // Dependency on statuses

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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            toast.error("File is too large. Max 15MB.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setIsUploading(true);
        const toastId = toast.loading("Uploading to Knowledge Base...");

        try {
            const res = await fetch(`/api/course/${courseId}/resources/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            toast.success("File queued for analysis!", { id: toastId });
            fetchResources(); // Immediate refresh to show "QUEUED" state
        } catch (error: any) {
            toast.error("Upload failed", { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (resourceId: string) => {
        if (!confirm("Delete this resource? The AI will lose access to this knowledge.")) return;

        setResources(prev => prev.filter(r => r.id !== resourceId)); // Optimistic update

        try {
            await fetch(`/api/course/${courseId}/resources/${resourceId}`, { method: "DELETE" });
            toast.success("Resource deleted");
        } catch (e) {
            toast.error("Failed to delete");
            fetchResources(); // Revert
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <BrainCircuit className="size-5 text-primary" />
                        Knowledge Base
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Upload textbooks or notes. The AI will learn from them.
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
                        Upload Resource
                    </Button>
                </div>
            </div>

            <div className="grid gap-3">
                {resources.map((res) => (
                    <div key={res.id} className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">

                        {/* Icon */}
                        <div className={cn(
                            "size-10 rounded-lg flex items-center justify-center shrink-0",
                            res.type === 'pdf' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                            <FileText className="size-5" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{res.fileName}</h4>
                                <StatusBadge status={res.status} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                                <span>{(res.metadata?.size ? (res.metadata.size / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown Size')}</span>
                                {res.metadata?.pageCount && <span>• {res.metadata.pageCount} Pages</span>}
                                {res.metadata?.previewStructure && <span className="text-primary font-medium">• Outline Ready ✨</span>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {res.url && (
                                <a href={res.url} target="_blank" rel="noreferrer">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <Download className="size-4" />
                                    </Button>
                                </a>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(res.id)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {!isLoading && resources.length === 0 && (
                    <div className="text-center py-12 border border-dashed rounded-xl">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <UploadCloud className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold">No resources yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Upload a PDF to see the magic happen.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "READY") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                <CheckCircle className="size-3" />
                Indexed
            </span>
        );
    }
    if (status === "PROCESSING" || status === "QUEUED") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                <Loader2 className="size-3 animate-spin" />
                {status === "QUEUED" ? "Queued" : "Analyzing..."}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
            Error
        </span>
    );
}
