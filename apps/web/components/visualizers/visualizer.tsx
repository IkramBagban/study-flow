
"use client"


import { D3Visualizer } from "./d3-visualizer"
import { UniversalRecharts } from "./rechart"
import MermaidDiagram from "./mermaid"
import { SVGDiagram } from "./svg"

interface VisualizerProps {
    type: "mermaid" | "recharts" | "svg" | "d3" | "none" | string;
    code: string | object;
    caption?: string;
}

export function Visualizer({ type, code, caption }: VisualizerProps) {
    if (type === "none" || !code) return null

    // Determine renderer
    const isMermaid = type === 'mermaid';
    const isRecharts = type === 'recharts' || type === 'chart';
    const isSvg = type === 'svg';
    const isD3 = type === 'd3';

    // Helper to ensure string code for components that need string
    const stringCode = typeof code === 'string' ? code : JSON.stringify(code);

    return (
        <figure className="my-8 group">
            <div className="relative overflow-hidden rounded-xl border border-white/5 ">
                {/* Subtle grid background for better context */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                <div className="relative p-6 md:p-8 flex justify-center min-h-[200px] items-center w-full">
                    {/* Mermaid needs string */}
                    {isMermaid && <MermaidDiagram code={stringCode} />}

                    {/* Recharts/D3 can handle object or string */}
                    {isRecharts && <UniversalRecharts code={code} />}
                    {isD3 && <D3Visualizer code={stringCode} />}

                    {/* SVG needs raw string */}
                    {isSvg && <SVGDiagram code={stringCode} />}
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
