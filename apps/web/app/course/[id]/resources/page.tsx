
import { ResourceManager } from "@/components/resources/resource-manager";

export default function ResourcesPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-border pb-6">
                <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Upload textbooks, notes, and papers. The AI will prioritize this content when teaching you.
                </p>
            </div>

            <ResourceManager />
        </div>
    );
}
