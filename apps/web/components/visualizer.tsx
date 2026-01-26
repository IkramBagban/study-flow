
"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import mermaid from "mermaid"
import { Monitor, ZoomIn, AlertCircle } from "lucide-react"
import {
    ResponsiveContainer,
    LineChart, Line,
    BarChart, Bar,
    AreaChart, Area,
    PieChart, Pie, Cell,
    ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts"
import { D3Visualizer } from "./d3-visualizer"

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
                    {isRecharts && <DynamicRechart code={code} />}
                    {isD3 && <D3Visualizer code={code as any} />}

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

// --- Mermaid Renderer ---
function MermaidDiagram({ code }: { code: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>("")
    const [error, setError] = useState<string | null>(null) // Store specific error

    useEffect(() => {
        if (!code) return

        const render = async () => {
            try {
                // Improved Sanitization with specific shape handling
                let sanitized = code;

                // 1. Handle Square Brackets [ ... ] - allow ( ) { } char content
                sanitized = sanitized.replace(/([a-zA-Z0-9_]+)\[([^\]]+)\]/g, (m, id, content) => {
                    return `${id}["${content.replace(/"/g, "'")}"]`;
                });

                // 2. Handle Round Brackets ( ... ) - tricky with nested parens, but we catch simple cases
                // We use a safe regex that doesn't break if there are no nested parens
                sanitized = sanitized.replace(/([a-zA-Z0-9_]+)\(([^)]+)\)/g, (m, id, content) => {
                    return `${id}("${content.replace(/"/g, "'")}")`;
                });

                // 3. Handle Curly Brackets { ... }
                sanitized = sanitized.replace(/([a-zA-Z0-9_]+)\{([^}]+)\}/g, (m, id, content) => {
                    return `${id}{"${content.replace(/"/g, "'")}"}`;
                });

                // Ensure unique ID
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
                const { svg } = await mermaid.render(id, sanitized)
                setSvg(svg)
                setError(null)
            } catch (e: any) {
                console.error("Mermaid render error:", e)

                // Last Resort: Clean "e.g." specifically which is the most common culprit
                try {
                    const patched = code
                        .replace(/\(e\.g\./g, "e.g.")
                        .replace(/\(eg/g, "eg")
                        .replace(/\)/g, ""); // Desperate remove of parens if all else fails in retry

                    const id = `mermaid-desperate-${Math.random().toString(36).substr(2, 9)}`
                    const { svg } = await mermaid.render(id, patched)
                    setSvg(svg)
                    setError(null)
                } catch (retryError) {
                    // Show the specific parsing error from Mermaid
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

// --- Recharts Renderer ---
function DynamicRechart({ code }: { code: string | object }) {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        try {
            // Handle both stringified JSON and direct Objects
            const parsed = typeof code === 'string' ? JSON.parse(code) : code;
            setData(parsed);
        } catch (e) {
            console.error("Rechart parse error", e);
            setError(true);
        }
    }, [code]);

    if (error) return <div className="text-red-400 text-xs">Invalid Chart Data</div>;
    if (!data) return <div className="text-muted-foreground text-xs animate-pulse">Loading Chart...</div>;

    // Normalize data structure to handle AI variabilities
    const rawType = (data.type || 'line').toLowerCase();
    const chartType = rawType.includes('bar') ? 'bar' :
        rawType.includes('area') ? 'area' :
            rawType.includes('pie') ? 'pie' :
                rawType.includes('composed') ? 'composed' : 'line';

    const chartData = data.data || [];

    const xKey = data.xKey || data.x_axis_key || data.xAxisKey || data.x_axis || data.xAxis || (data.keys && !Array.isArray(data.keys) ? data.keys.x : 'name');

    // Handle single y-axis key or array of keys
    let seriesKeys = data.keys ||
        (data.y_axis_key ? [data.y_axis_key] : null) ||
        (data.yAxisKey ? [data.yAxisKey] : null) ||
        (data.y_axis ? [data.y_axis] : null) ||
        (data.yAxis ? [data.yAxis] : null) ||
        ['value'];

    // Extract keys if it's an object map
    if (!Array.isArray(seriesKeys) && typeof seriesKeys === 'object' && seriesKeys !== null) {
        seriesKeys = Object.values(seriesKeys).filter(k => k !== xKey && k !== 'x' && k !== 'time');
    }

    // Robustness: Ensure it's an array
    if (!Array.isArray(seriesKeys)) {
        seriesKeys = [seriesKeys];
    }

    // Colors for series
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    const CommonAxis = () => (
        <>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey={xKey} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#e4e4e7' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
        </>
    );

    return (
        <div className="w-full h-[300px] text-xs">
            <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                    <BarChart data={chartData}>
                        <CommonAxis />
                        {seriesKeys.map((k: string, i: number) => (
                            <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                ) : chartType === 'area' ? (
                    <AreaChart data={chartData}>
                        <CommonAxis />
                        {seriesKeys.map((k: string, i: number) => (
                            <Area key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.2} />
                        ))}
                    </AreaChart>
                ) : chartType === 'pie' ? (
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                ) : chartType === 'composed' ? (
                    <ComposedChart data={chartData}>
                        <CommonAxis />
                        {seriesKeys.map((k: string, i: number) => (
                            k.toLowerCase().includes('volume') ?
                                <Bar key={k} dataKey={k} fill={colors[i % colors.length]} opacity={0.3} /> :
                                <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
                        ))}
                    </ComposedChart>
                ) : (
                    <LineChart data={chartData}>
                        <CommonAxis />
                        {seriesKeys?.map((k: string, i: number) => (
                            <Line
                                key={k}
                                type="monotone"
                                dataKey={k}
                                stroke={colors[i % colors.length]}
                                strokeWidth={2}
                                dot={{ fill: colors[i % colors.length], strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}

// --- SVG Renderer ---
function SVGDiagram({ code }: { code: string }) {
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
