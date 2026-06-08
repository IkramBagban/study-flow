"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { apiErrorMessage } from "@/lib/api-client-errors";

interface RegenerateButtonProps {
    chapterId: string;
    className?: string;
    variant?: "icon" | "button";
}

export function RegenerateButton({ chapterId, className, variant = "button" }: RegenerateButtonProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const router = useRouter();

    const handleRegenerate = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isRegenerating) return;

        const confirmRegen = confirm("Are you sure you want to regenerate this chapter? Current content will be lost.");
        if (!confirmRegen) return;

        setIsRegenerating(true);
        try {
            const res = await fetch(`/api/course/chapter/${chapterId}/regenerate`, {
                method: "POST"
            });

            if (!res.ok) {
                alert(await apiErrorMessage(res, "Failed to regenerate chapter."));
                return;
            }
            router.refresh();
        } catch (error) {
            console.error("Regeneration error:", error);
            alert("An error occurred during regeneration");
        } finally {
            setIsRegenerating(false);
        }
    };

    if (variant === "icon") {
        return (
            <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className={cn(
                    "p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-all duration-300",
                    isRegenerating && "animate-spin text-primary",
                    className
                )}
                title="Regenerate Chapter Content"
            >
                <RefreshCcw className="size-4" />
            </button>
        );
    }

    return (
        <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors",
                isRegenerating && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <RefreshCcw className={cn("size-4", isRegenerating && "animate-spin")} />
            {isRegenerating ? "Regenerating..." : "Regenerate Chapter"}
        </button>
    );
}
