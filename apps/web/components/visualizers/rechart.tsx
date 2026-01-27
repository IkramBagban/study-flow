"use client"

import { useState, useEffect } from "react"
import * as RechartsLib from "recharts"
import { AlertCircle } from "lucide-react"

const {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    // All chart types
    LineChart,
    BarChart,
    AreaChart,
    PieChart,
    ScatterChart,
    RadarChart,
    RadialBarChart,
    ComposedChart,
    FunnelChart,
    Treemap,
    // SankeyChart,
    // All series components
    Line,
    Bar,
    Area,
    Pie,
    Scatter,
    Radar,
    RadialBar,
    Funnel,
    Cell,
    // Other components
    Brush,
    ReferenceLine,
    ReferenceArea,
    ErrorBar,
    LabelList
} = RechartsLib

interface UniversalRechartsProps {
    code: string | object
}

export function UniversalRecharts({ code }: UniversalRechartsProps) {
    const [config, setConfig] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        try {
            let parsed = code

            if (typeof code === 'string') {
                let cleaned = code.trim()

                // Extract JSON if it's wrapped in markdown fences
                if (cleaned.includes('```')) {
                    const match = cleaned.match(/```(?:json|js|jsx)?\s*([\s\S]*?)\s*```/)
                    if (match && match[1]) cleaned = match[1]
                }

                // If it still looks like it might contain code, try a more aggressive approach (extract first { ... })
                if (cleaned.includes('{') && cleaned.includes('}')) {
                    const start = cleaned.indexOf('{')
                    const end = cleaned.lastIndexOf('}')
                    if (start !== -1 && end !== -1) {
                        cleaned = cleaned.substring(start, end + 1)
                    }
                }

                parsed = JSON.parse(cleaned)
            }

            setConfig(parsed)
            setError(null)
        } catch (e) {
            console.error("Parse error:", e)
            setError(e instanceof Error ? e.message : "Invalid data structure")
        }
    }, [code])

    if (error) {
        return (
            <div className="text-red-400 text-xs p-4 font-mono bg-red-500/10 rounded flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                    <AlertCircle size={14} />
                    <span>Visualization Error</span>
                </div>
                <div className="opacity-70 text-[10px] break-all">{error}</div>
                <details className="mt-2 text-white/40">
                    <summary className="cursor-pointer hover:underline text-[9px]">View Raw Source</summary>
                    <pre className="mt-2 p-2 bg-black/50 rounded text-[9px] whitespace-pre-wrap max-h-[150px] overflow-auto">
                        {typeof code === 'string' ? code : JSON.stringify(code, null, 2)}
                    </pre>
                </details>
            </div>
        )
    }

    if (!config) {
        return <div className="text-muted-foreground text-xs p-4 text-center animate-pulse">Loading...</div>
    }

    return <DynamicRechartsRenderer config={config} />
}

// ============================================================================
// DYNAMIC RENDERER - Adapts to ANY Recharts configuration
// ============================================================================

function DynamicRechartsRenderer({ config }: { config: any }) {
    const data = config.data || []

    if (!Array.isArray(data) || data.length === 0) {
        return <div className="text-xs p-4 text-center text-muted-foreground">No data</div>
    }

    // ============================================================================
    // SMART KEY DETECTION
    // ============================================================================

    const firstItem = data[0]
    const allKeys = Object.keys(firstItem)

    // Find X-axis key (category/label field)
    const xKey = config.xKey || config.dataKey || config.xAxis ||
        allKeys.find(k => typeof firstItem[k] === 'string') ||
        allKeys[0]

    // Find Y-axis keys (all numeric fields except x-axis)
    let seriesKeys = config.keys || config.series || config.yKeys ||
        allKeys.filter(k =>
            k !== xKey &&
            typeof firstItem[k] === 'number' &&
            !['id', 'index', 'key', 'angle', 'radius'].includes(k.toLowerCase())
        )

    // Normalize to array
    if (!Array.isArray(seriesKeys)) {
        if (typeof seriesKeys === 'string') seriesKeys = [seriesKeys]
        else if (typeof seriesKeys === 'object' && seriesKeys !== null) seriesKeys = Object.values(seriesKeys)
        else seriesKeys = []
    }

    if (seriesKeys.length === 0) seriesKeys = ['value']

    // ============================================================================
    // CHART TYPE & CONFIGURATION
    // ============================================================================

    const chartType = (config.type || 'line').toLowerCase()
    const colors = config.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    const height = config.height || 300

    // ============================================================================
    // DYNAMIC CHART COMPONENT SELECTION
    // ============================================================================

    const ChartComponent = getChartComponent(chartType)

    if (!ChartComponent) {
        return (
            <div className="text-yellow-400 text-xs p-4">
                Unsupported chart type: {chartType}
            </div>
        )
    }

    // ============================================================================
    // RENDER CHART WITH DYNAMIC SERIES
    // ============================================================================

    return (
        <div className="w-full" style={{ height: `${height}px` }} suppressHydrationWarning>
            <ResponsiveContainer width="100%" height="100%">
                <ChartComponent data={data} {...(config.chartProps || {})}>
                    {/* Render standard components for cartesian charts */}
                    {isCartesianChart(chartType) && (
                        <>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff10"
                                vertical={false}
                                {...(config.gridProps || {})}
                            />
                            <XAxis
                                dataKey={xKey}
                                stroke="#71717a"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#71717a' }}
                                {...(config.xAxisProps || {})}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#71717a' }}
                                {...(config.yAxisProps || {})}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    borderColor: '#ffffff10',
                                    borderRadius: '12px',
                                    fontSize: '11px'
                                }}
                                {...(config.tooltipProps || {})}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }}
                                {...(config.legendProps || {})}
                            />

                            {/* Render brush if specified */}
                            {config.brush && <Brush {...(typeof config.brush === 'object' ? config.brush : {})} />}
                        </>
                    )}

                    {/* Render tooltip and legend for non-cartesian charts */}
                    {!isCartesianChart(chartType) && (
                        <>
                            <Tooltip {...(config.tooltipProps || {})} />
                            {chartType !== 'treemap' && <Legend {...(config.legendProps || {})} />}
                        </>
                    )}

                    {/* Dynamically render all series */}
                    {renderSeries(chartType, seriesKeys, colors, config, data, xKey)}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    )
}

// ============================================================================
// HELPER: Get Chart Component by Type
// ============================================================================

function getChartComponent(type: string) {
    const chartMap: Record<string, any> = {
        line: LineChart,
        bar: BarChart,
        area: AreaChart,
        pie: PieChart,
        scatter: ScatterChart,
        radar: RadarChart,
        radialbar: RadialBarChart,
        composed: ComposedChart,
        funnel: FunnelChart,
        treemap: Treemap,
        // sankey: SankeyChart
    }

    return chartMap[type.toLowerCase().replace(/chart$/, '')]
}

// ============================================================================
// HELPER: Check if Cartesian Chart (needs XAxis/YAxis)
// ============================================================================

function isCartesianChart(type: string): boolean {
    return ['line', 'bar', 'area', 'scatter', 'composed'].includes(type.toLowerCase())
}

// ============================================================================
// HELPER: Dynamically Render Series Components
// ============================================================================

function renderSeries(
    chartType: string,
    seriesKeys: string[],
    colors: string[],
    config: any,
    data: any[],
    xKey: string
) {
    switch (chartType.toLowerCase()) {
        case 'line':
            return seriesKeys.map((key, i) => (
                <Line
                    key={key}
                    type={config.lineType || "monotone"}
                    dataKey={key}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={{ fill: colors[i % colors.length], r: 4 }}
                    activeDot={{ r: 6 }}
                    {...(config.lineProps || {})}
                />
            ))

        case 'bar':
            return seriesKeys.map((key, i) => (
                <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[i % colors.length]}
                    radius={[4, 4, 0, 0]}
                    {...(config.barProps || {})}
                />
            ))

        case 'area':
            return seriesKeys.map((key, i) => (
                <Area
                    key={key}
                    type={config.areaType || "monotone"}
                    dataKey={key}
                    stroke={colors[i % colors.length]}
                    fill={colors[i % colors.length]}
                    fillOpacity={0.2}
                    {...(config.areaProps || {})}
                />
            ))

        case 'scatter':
            return seriesKeys.map((key, i) => (
                <Scatter
                    key={key}
                    dataKey={key}
                    fill={colors[i % colors.length]}
                    {...(config.scatterProps || {})}
                />
            ))

        case 'pie':
            return (
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={config.innerRadius || 60}
                    outerRadius={config.outerRadius || 80}
                    paddingAngle={config.paddingAngle || 5}
                    dataKey={seriesKeys[0]}
                    nameKey={xKey}
                    {...(config.pieProps || {})}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
            )

        case 'radar':
            return (
                <>
                    {/* Radar needs polarGrid and polarAngleAxis */}
                    <RechartsLib.PolarGrid />
                    <RechartsLib.PolarAngleAxis dataKey={xKey} />
                    <RechartsLib.PolarRadiusAxis />
                    {seriesKeys.map((key, i) => (
                        <Radar
                            key={key}
                            dataKey={key}
                            stroke={colors[i % colors.length]}
                            fill={colors[i % colors.length]}
                            fillOpacity={0.3}
                            {...(config.radarProps || {})}
                        />
                    ))}
                </>
            )

        case 'radialbar':
            return (
                <RadialBar
                    dataKey={seriesKeys[0]}
                    {...(config.radialBarProps || {})}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </RadialBar>
            )

        case 'composed':
            // Composed chart: dynamically decide Line vs Bar based on config
            return seriesKeys.map((key, i) => {
                const seriesType = config.seriesTypes?.[key] ||
                    (key.toLowerCase().includes('volume') ? 'bar' : 'line')

                if (seriesType === 'bar') {
                    return (
                        <Bar
                            key={key}
                            dataKey={key}
                            fill={colors[i % colors.length]}
                            opacity={0.3}
                            {...(config.barProps || {})}
                        />
                    )
                } else if (seriesType === 'area') {
                    return (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[i % colors.length]}
                            fill={colors[i % colors.length]}
                            fillOpacity={0.2}
                            {...(config.areaProps || {})}
                        />
                    )
                } else {
                    return (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[i % colors.length]}
                            strokeWidth={2}
                            dot={false}
                            {...(config.lineProps || {})}
                        />
                    )
                }
            })

        case 'funnel':
            return (
                <Funnel
                    dataKey={seriesKeys[0]}
                    data={data}
                    {...(config.funnelProps || {})}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Funnel>
            )

        default:
            return null
    }
}