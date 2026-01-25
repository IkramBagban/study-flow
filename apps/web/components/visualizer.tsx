
"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { Monitor, ZoomIn } from "lucide-react"

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

interface VisualizerProps {
    type: "mermaid" | "none";
    code: string;
    caption?: string;
}

export function Visualizer({ type, code, caption }: VisualizerProps) {
    if (type === "none" || !code) return null

    return (
        <figure className="my-8 group">
            <div className="relative overflow-hidden rounded-xl border border-white/5">
                {/* Subtle grid background for better context */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                <div className="relative p-8 flex justify-center min-h-[200px] items-center">
                    {type === "mermaid" && <MermaidDiagram code={code} />}
                </div>
            </div>

            {caption && (
                <figcaption className="mt-3 text-center text-sm text-muted-foreground/80 italic">
                    {caption}
                </figcaption>
            )}
        </figure>
    )
}

function MermaidDiagram({ code }: { code: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>("")
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        if (!code) return

        const render = async () => {
            try {
                // Better flowcharts (Graph) styling
                // Injecting class directives if possible, or just relying on base theme
                // Unique ID for each diagram
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
                const { svg } = await mermaid.render(id, code)
                setSvg(svg)
                setError(false)
            } catch (e) {
                console.error("Mermaid render error:", e)
                setError(true)
            }
        }

        render()
    }, [code])

    if (error) return (
        <div className="text-red-400 text-sm p-4 font-mono">
            Failed to render diagram. Code possibly invalid.
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
