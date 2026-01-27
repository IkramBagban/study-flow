"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface D3VisualizerProps {
    code: string
}

export function D3Visualizer({ code }: D3VisualizerProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        try {
            // Remove markdown fences if present
            let cleanCode = code.trim();
            if (cleanCode.startsWith('```')) {
                cleanCode = cleanCode.replace(/^```(?:json|js)?\n/, '').replace(/\n```$/, '');
            }

            const config = JSON.parse(cleanCode)
            let { type, data, config: chartConfig } = config

            // --- ULTRA-RESILIENT DATA PARSING ---
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                data = Object.entries(data).map(([key, value]) => ({
                    label: key,
                    value: typeof value === 'number' ? value : parseFloat(String(value)) || 0
                }));
            }

            if (!Array.isArray(data) || data.length === 0) return;

            // --- SMART KEY DISCOVERY (SCAN ALL ITEMS) ---
            const allKeys = Array.from(new Set(data.flatMap(d => Object.keys(d))));

            const xKey = chartConfig?.xKey || chartConfig?.xAxis ||
                allKeys.find(k => ['label', 'name', 'x', 'product', 'item'].includes(k.toLowerCase())) ||
                allKeys.find(k => data.some(d => typeof d[k] === 'string')) ||
                allKeys[0];

            const yKey = chartConfig?.yKey || chartConfig?.yAxis ||
                allKeys.find(k => ['value', 'amount', 'sales', 'count', 'y'].includes(k.toLowerCase())) ||
                allKeys.find(k => k !== xKey && data.some(d => typeof d[k] === 'number')) ||
                allKeys.find(k => k !== xKey) ||
                allKeys[0];

            // Clear previous chart
            d3.select(containerRef.current).selectAll("*").remove()

            const width = 600
            const height = 350
            const margin = { top: 30, right: 30, bottom: 50, left: 60 }

            const svg = d3
                .select(containerRef.current)
                .append("svg")
                .attr("viewBox", `0 0 ${width} ${height}`)
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("class", "rounded-lg overflow-visible")
                .style("max-height", "400px")

            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

            const innerWidth = width - margin.left - margin.right
            const innerHeight = height - margin.top - margin.bottom

            // Utility to parse values safely
            const val = (d: any, key: string) => {
                const v = d[key];
                if (typeof v === 'number') return v;
                const parsed = parseFloat(String(v));
                return isNaN(parsed) ? 0 : parsed;
            };

            switch (type) {
                case "line": {
                    const xExtent = d3.extent(data, (d: any) => val(d, xKey))
                    const yMax = d3.max(data, (d: any) => val(d, yKey))

                    const x = d3.scaleLinear()
                        .domain([xExtent[0] || 0, xExtent[1] || 1])
                        .range([0, innerWidth])

                    const y = d3.scaleLinear()
                        .domain([0, (yMax || 1) * 1.1])
                        .range([innerHeight, 0])

                    // Add helper for grid
                    g.append("g")
                        .attr("class", "grid")
                        .attr("opacity", 0.1)
                        .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => ""))

                    // Add axes
                    g.append("g")
                        .attr("transform", `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x).ticks(5))
                        .attr("color", "#71717a")

                    g.append("g")
                        .call(d3.axisLeft(y).ticks(5))
                        .attr("color", "#71717a")

                    // Add line
                    const line = d3.line<any>()
                        .x((d) => x(val(d, xKey)))
                        .y((d) => y(val(d, yKey)))
                        .curve(d3.curveMonotoneX)

                    g.append("path")
                        .datum(data)
                        .attr("fill", "none")
                        .attr("stroke", chartConfig?.color || "#3b82f6")
                        .attr("stroke-width", 3)
                        .attr("d", line)

                    // Add dots
                    g.selectAll("circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("cx", (d: any) => x(val(d, xKey)))
                        .attr("cy", (d: any) => y(val(d, yKey)))
                        .attr("r", 5)
                        .attr("fill", chartConfig?.color || "#3b82f6")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 2)
                    break
                }

                case "bar": {
                    const yMax = d3.max(data, (d: any) => val(d, yKey))

                    const x = d3.scaleBand()
                        .domain(data.map((d: any) => String(d[xKey])))
                        .range([0, innerWidth])
                        .padding(0.3)

                    const y = d3.scaleLinear()
                        .domain([0, (yMax || 1) * 1.1])
                        .range([innerHeight, 0])

                    // Grid
                    g.append("g")
                        .attr("class", "grid")
                        .attr("opacity", 0.05)
                        .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => ""))

                    // Axes
                    g.append("g")
                        .attr("transform", `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x))
                        .attr("color", "#71717a")
                        .selectAll("text")
                        .attr("dy", "1em")

                    g.append("g")
                        .call(d3.axisLeft(y).ticks(5))
                        .attr("color", "#71717a")

                    // Bars
                    g.selectAll("rect")
                        .data(data)
                        .enter()
                        .append("rect")
                        .attr("x", (d: any) => x(String(d[xKey])) || 0)
                        .attr("y", (d: any) => y(val(d, yKey)))
                        .attr("width", x.bandwidth())
                        .attr("height", (d: any) => innerHeight - y(val(d, yKey)))
                        .attr("rx", 6)
                        .attr("fill", chartConfig?.color || "#10b981")
                        .attr("opacity", 0.8)
                    break
                }

                case "scatter": {
                    const xExtent = d3.extent(data, (d: any) => val(d, xKey))
                    const yExtent = d3.extent(data, (d: any) => val(d, yKey))

                    const x = d3.scaleLinear()
                        .domain([xExtent[0] || 0, (xExtent[1] || 1) * 1.05])
                        .range([0, innerWidth])

                    const y = d3.scaleLinear()
                        .domain([0, (yExtent[1] || 1) * 1.05])
                        .range([innerHeight, 0])

                    g.append("g")
                        .attr("transform", `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x))
                        .attr("color", "#71717a")

                    g.append("g")
                        .call(d3.axisLeft(y))
                        .attr("color", "#71717a")

                    g.selectAll("circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("cx", (d: any) => x(val(d, xKey)))
                        .attr("cy", (d: any) => y(val(d, yKey)))
                        .attr("r", 6)
                        .attr("fill", chartConfig?.color || "#f59e0b")
                        .attr("opacity", 0.6)
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 1)
                    break
                }

                case "area": {
                    const xExtent = d3.extent(data, (d: any) => val(d, xKey))
                    const yMax = d3.max(data, (d: any) => val(d, yKey))

                    const x = d3.scaleLinear()
                        .domain([xExtent[0] || 0, xExtent[1] || 1])
                        .range([0, innerWidth])

                    const y = d3.scaleLinear()
                        .domain([0, (yMax || 1) * 1.1])
                        .range([innerHeight, 0])

                    g.append("g")
                        .attr("transform", `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x))
                        .attr("color", "#71717a")

                    g.append("g")
                        .call(d3.axisLeft(y))
                        .attr("color", "#71717a")

                    const area = d3.area<any>()
                        .x((d) => x(val(d, xKey)))
                        .y0(innerHeight)
                        .y1((d) => y(val(d, yKey)))
                        .curve(d3.curveMonotoneX)

                    g.append("path")
                        .datum(data)
                        .attr("fill", chartConfig?.color || "#8b5cf6")
                        .attr("fill-opacity", 0.2)
                        .attr("d", area)

                    const line = d3.line<any>()
                        .x((d) => x(val(d, xKey)))
                        .y((d) => y(val(d, yKey)))
                        .curve(d3.curveMonotoneX)

                    g.append("path")
                        .datum(data)
                        .attr("fill", "none")
                        .attr("stroke", chartConfig?.color || "#8b5cf6")
                        .attr("stroke-width", 3)
                        .attr("d", line)
                    break
                }

                default:
                    throw new Error(`Unsupported D3 chart type: ${type}`)
            }
        } catch (error) {
            console.error("D3 rendering error:", error)
            if (containerRef.current) {
                containerRef.current.innerHTML = `
                    <div class="text-red-400 text-xs p-4 font-mono bg-red-500/10 rounded flex items-center gap-2">
                        Failed to render D3 chart
                    </div>
                `
            }
        }
    }, [code])

    return <div ref={containerRef} className="w-full flex justify-center" />
}
