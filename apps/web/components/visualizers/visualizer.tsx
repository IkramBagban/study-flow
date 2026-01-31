
"use client"


import { D3Visualizer } from "./d3-visualizer"
import { UniversalRecharts } from "./rechart"
import MermaidDiagram from "./mermaid"
import { SVGDiagram } from "./svg"
import { TimelineVisualizer } from "./timeline"
import { ChemistryVisualizer } from "./chemistry"
import { MafsVisualizer } from "./mafs-visualizer"
import { NivoVisualizer } from "./nivo-visualizer"

interface VisualizerProps {
    type: "mermaid" | "recharts" | "svg" | "d3" | "timeline" | "chemistry" | "map" | "mafs" | "nivo" | "none" | string;
    code: string | any;
    caption?: string;
}

export function Visualizer({ type, code, caption }: VisualizerProps) {
    if (type === "none" || !code) return null

    // Determine renderer
    const isMermaid = type === 'mermaid';
    const isRecharts = type === 'recharts' || type === 'chart';
    const isSvg = type === 'svg';
    const isD3 = type === 'd3';
    const isTimeline = type === 'timeline';
    const isChemistry = type === 'chemistry';
    const isMafs = type === 'mafs';
    const isNivo = type === 'nivo';

    // Helper to ensure string code for components that need string
    const stringCode = typeof code === 'string' ? code : JSON.stringify(code);
    const parsedData = typeof code === 'string' ? (() => { try { return JSON.parse(code); } catch { return null; } })() : code;

    return (
        <figure className="my-8 group">
            <div className="relative overflow-hidden rounded-xl border border-white/5 ">
                {/* Subtle grid background for better context */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                <div className="relative p-6 md:p-8 flex justify-center min-h-[200px] items-center w-full">
                    {/* Specialized Renderers */}
                    {isMermaid && <MermaidDiagram code={stringCode} />}
                    {isRecharts && <UniversalRecharts code={code} />}
                    {isD3 && <D3Visualizer code={stringCode} />}
                    {isSvg && <SVGDiagram code={stringCode} />}
                    {isTimeline && <TimelineVisualizer data={stringCode} />}
                    {isChemistry && <ChemistryVisualizer smiles={stringCode} />}
                    {isMafs && <MafsVisualizer code={stringCode} />}
                    {isNivo && <NivoVisualizer data={parsedData?.data || parsedData} type={(parsedData?.type as any) || "line"} />}

                    {/* Fallback for Map or unknown types */}
                    {!isMermaid && !isRecharts && !isD3 && !isSvg && !isTimeline && !isChemistry && !isMafs && !isNivo && (
                        <div className="p-8 text-center border border-dashed border-border rounded-xl">
                            <p className="text-sm text-muted-foreground italic mb-2">Visualizing {type} content...</p>
                            <pre className="text-[10px] bg-muted p-2 rounded max-w-full overflow-hidden text-ellipsis">{stringCode}</pre>
                        </div>
                    )}
                </div>
            </div>

            {(caption || type) && (
                <figcaption className="mt-3 text-center text-sm text-muted-foreground/80 italic">
                    {caption}{caption ? ' ' : ''}({type})
                </figcaption>
            )}
        </figure>
    )
}
