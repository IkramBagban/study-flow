
"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { AlertCircle } from "lucide-react"

mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: 'strict',
    fontFamily: 'inherit',
    themeVariables: {
        primaryTextColor: '#e4e4e7', // zinc-200
        lineColor: '#000000ff', // zinc-400
        secondaryColor: '#18181b', // zinc-950
        tertiaryColor: '#27272a', // zinc-900
    }
})

export default function MermaidDiagram({ code }: { code: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>("")
    const [error, setError] = useState<string | null>(null) // Store specific error

    useEffect(() => {
        if (!code) return

        const render = async () => {
            try {
                let sanitized = code.trim();

                // Remove markdown fences
                if (sanitized.startsWith('```')) {
                    sanitized = sanitized.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
                }

                // Mermaid doesn't like special chars in labels unless quoted correctly.
                // We'll escape problematic characters in labels that aren't already quoted.
                sanitized = sanitized
                    .replace(/([a-zA-Z0-9_-]+)\(([^)]+)\)/g, '$1("$2")')
                    .replace(/([a-zA-Z0-9_-]+)\[([^\]]+)\]/g, '$1["$2"]');

                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
                const { svg } = await mermaid.render(id, sanitized)
                setSvg(svg)
                setError(null)
            } catch (e: any) {
                console.error("Mermaid render error:", e)

                // Try one more time with super-aggressive cleaning
                try {
                    const superCleaned = code
                        .replace(/[()[\]{}]/g, ' ')
                        .replace(/["']/g, '');

                    const id = `mermaid-retry-${Math.random().toString(36).substr(2, 9)}`
                    const { svg } = await mermaid.render(id, `graph TD\n  Node["${superCleaned.substring(0, 100).replace(/\n/g, ' ')}"]`)
                    setSvg(svg)
                    setError(null)
                } catch (retryErr) {
                    setError(e.message.split('\n')[0])
                }
            }
        }

        render()
    }, [code])

    if (error) return (
        <div className="text-red-400 text-xs p-4 font-mono bg-red-500/10 rounded flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={14} />
                Failed to render diagram
            </div>
            <div className="opacity-70">{error}</div>
            <pre className="text-[10px] opacity-50 whitespace-pre-wrap">{code}</pre>
        </div>
    )

    return (
        <div
            ref={ref}
            className="mermaid-svg-container w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}