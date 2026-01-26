
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
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts"

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
    type: "mermaid" | "recharts" | "none" | string;
    code: string; // Mermaid code OR JSON string for Recharts
    caption?: string;
}

export function Visualizer({ type, code, caption }: VisualizerProps) {
    if (type === "none" || !code) return null

    // Determine renderer
    const isMermaid = type === 'mermaid';
    const isRecharts = type === 'recharts' || type === 'chart';

    return (
        <figure className="my-8 group">
            <div className="relative overflow-hidden rounded-xl border border-white/5 ">
                {/* Subtle grid background for better context */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                <div className="relative p-6 md:p-8 flex justify-center min-h-[200px] items-center w-full">
                    {isMermaid && <MermaidDiagram code={code} />}
                    {isRecharts && <DynamicRechart code={code} />}
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
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        if (!code) return

        const render = async () => {
            try {
                // Ensure unique ID
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
        <div className="text-red-400 text-xs p-4 font-mono bg-red-500/10 rounded flex items-center gap-2">
            <AlertCircle size={14} />
            Failed to render diagram
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
function DynamicRechart({ code }: { code: string }) {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        try {
            const parsed = JSON.parse(code);
            setData(parsed);
        } catch (e) {
            console.error("Rechart parse error", e);
            setError(true);
        }
    }, [code]);

    if (error) return <div className="text-red-400 text-xs">Invalid Chart Data</div>;
    if (!data) return <div className="text-muted-foreground text-xs animate-pulse">Loading Chart...</div>;

    // data expected structure: { type: 'line', data: [], xKey: 'name', keys: ['value1'] }
    const chartType = data.type || 'line';
    const chartData = data.data || [];
    const xKey = data.xKey || 'name';
    const seriesKeys = data.keys || ['value'];

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
                ) : (
                    <LineChart data={chartData}>
                        <CommonAxis />
                        {seriesKeys.map((k: string, i: number) => (
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
