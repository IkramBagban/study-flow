"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function CourseGenerationLoader({ courseId }: { courseId: string }) {
    const router = useRouter();
    const [modules, setModules] = useState<{ id: string, title: string, description: string }[]>([]);
    const [status, setStatus] = useState("GENERATING");

    useEffect(() => {
        const poll = async () => {
            // Stop polling if error or ready (though ready triggers refresh)
            if (status === "ERROR" || status === "READY") return;

            try {
                // Check Status
                const statusRes = await fetch(`/api/course/${courseId}/status`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();

                    if (statusData.status === "READY") {
                        setStatus("READY");
                        router.refresh();
                        return;
                    }
                    if (statusData.status === "ERROR") {
                        setStatus("ERROR");
                        return;
                    }
                }

                // Check Outline
                const outlineRes = await fetch(`/api/course/${courseId}/outline`);
                if (outlineRes.ok) {
                    const outlineData = await outlineRes.json();
                    if (outlineData.modules) {
                        setModules(prev => {
                            if (outlineData.modules.length > prev.length) {
                                return outlineData.modules;
                            }
                            return prev;
                        });
                    }
                }
            } catch (e) { console.error(e); }
        };

        const interval = setInterval(poll, 1500);
        poll(); // Initial call

        return () => clearInterval(interval);
    }, [courseId, router, status]);

    if (status === "ERROR") {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-4 animate-in fade-in">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-red-100 mb-2">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-600">Course Generation Failed</h2>
                <p className="text-muted-foreground">
                    Something went wrong while building your course. Please try again or check the server logs.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Constructing Your Course</h2>
                <p className="text-muted-foreground text-lg">
                    The AI Architect is designing your curriculum, module by module.
                </p>
            </div>

            <div className="space-y-4">
                {modules.map((module, i) => (
                    <div key={module.id} className="p-4 rounded-xl border border-border bg-card flex items-center gap-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 shrink-0 border border-green-500/20">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground">Module {i + 1}: {module.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{module.description}</p>
                        </div>
                    </div>
                ))}

                {status !== "READY" && (
                    <div className="p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 flex items-center gap-4 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-primary/10 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-primary/10 rounded w-1/3" />
                            <div className="h-3 bg-primary/10 rounded w-2/3" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
