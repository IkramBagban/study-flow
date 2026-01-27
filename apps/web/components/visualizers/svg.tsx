
// "use client"

import { AlertCircle } from "lucide-react"


export function SVGDiagram({ code }: { code: string }) {
    // Clean up code: remove markdown code blocks if present
    let cleanCode = code.trim();
    if (cleanCode.startsWith('```')) {
        cleanCode = cleanCode.replace(/^```(xml|svg)?\n/, '').replace(/\n```$/, '');
    }

    // Basic safety check: Ensure it looks like an SVG
    if (!cleanCode.includes('<svg')) {
        return (
            <div className="text-red-400 text-xs p-4 font-mono bg-red-500/10 rounded flex items-center gap-2">
                <AlertCircle size={14} />
                Invalid SVG Code
            </div>
        )
    }

    return (
        <div
            className="w-full flex justify-center items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
            <div
                className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[600px] p-4"
                dangerouslySetInnerHTML={{ __html: cleanCode }}
            />
        </div>
    )
}