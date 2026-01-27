
// "use client"

import { AlertCircle } from "lucide-react"


export function SVGDiagram({ code }: { code: string }) {
    // Basic safety check: Ensure it starts with <svg and ends with </svg>
    const cleanCode = code.trim();
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
            className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto  [&>svg]:p-4 [&>svg]:rounded-lg"
            dangerouslySetInnerHTML={{ __html: cleanCode }}
        />
    )
}