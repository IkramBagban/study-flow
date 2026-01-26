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
            const config = JSON.parse(code)
            const { type, data, config: chartConfig } = config

            // Clear previous chart
            d3.select(containerRef.current).selectAll("*").remove()

            const width = 600
            const height = 400
            const margin = { top: 20, right: 30, bottom: 40, left: 50 }

            const svg = d3
                .select(containerRef.current)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "bg-white rounded-lg")

            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

            const innerWidth = width - margin.left - margin.right
            const innerHeight = height - margin.top - margin.bottom

            switch (type) {
                case "line": {
                    const xExtent = d3.extent(data, (d: any) => Number(d.x))
                    const yMax = d3.max(data, (d: any) => Number(d.y))

                    const x = d3
                        .scaleLinear()
                        .domain(xExtent[0] !== undefined && xExtent[1] !== undefined ? [xExtent[0], xExtent[1]] : [0, 1])
                        .range([0, innerWidth])

                    const y = d3
                        .scaleLinear()
                        .domain([0, yMax || 1])
                        .range([innerHeight, 0])

                    // Add axes
                    g.append("g")
                        .attr("transform", `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x))
                        .append("text")
                        .attr("x", innerWidth / 2)
                        .attr("y", 35)
                        .attr("fill", "#000")
                        .text(chartConfig?.xLabel || "X")

                    g.append("g")
                        .call(d3.axisLeft(y))
                        .append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", -40)
                        .attr("x", -innerHeight / 2)
                        .attr("fill", "#000")
                        .text(chartConfig?.yLabel || "Y")

                    // Add line
                    const line = d3
                        .line<any>()
                        .x((d) => x(d.x))
                        .y((d) => y(d.y))

                    g.append("path")
                        .datum(data)
                        .attr("fill", "none")
                        .attr("stroke", chartConfig?.color || "#3b82f6")
                        .attr("stroke-width", 2)
                        .attr("d", line)

                    // Add dots
                    g.selectAll("circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("cx", (d: any) => x(d.x))
                        .attr("cy", (d: any) => y(d.y))
                        .attr("r", 4)
                        .attr("fill", chartConfig?.color || "#3b82f6")
                    break
                }

                case "bar": {
                    const yMax = d3.max(data, (d: any) => Number(d.value))

                    const x = d3
                        .scaleBand()
                        .domain(data.map((d: any) => d.label))
                        .range([0, innerWidth])
                        .padding(0.2)

                    const y = d3
                        .scaleLinear()
                        .domain([0, yMax || 1])
                        .range([innerHeight, 0])

                    // Add axes
                    g.append("g")
                        .attr("transform", `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x))

                    g.append("g").call(d3.axisLeft(y))

                    // Add bars
                    g.selectAll("rect")
                        .data(data)
                        .enter()
                        .append("rect")
                        .attr("x", (d: any) => x(d.label) || 0)
                        .attr("y", (d: any) => y(d.value))
                        .attr("width", x.bandwidth())
                        .attr("height", (d: any) => innerHeight - y(d.value))
                        .attr("fill", chartConfig?.color || "#10b981")
                    break
                }

                case "scatter": {
                    const xExtent = d3.extent(data, (d: any) => Number(d.x))
                    const yExtent = d3.extent(data, (d: any) => Number(d.y))

                    const x = d3
                        .scaleLinear()
                        .domain(xExtent[0] !== undefined && xExtent[1] !== undefined ? [xExtent[0], xExtent[1]] : [0, 1])
                        .range([0, innerWidth])

                    const y = d3
                        .scaleLinear()
                        .domain(yExtent[0] !== undefined && yExtent[1] !== undefined ? [yExtent[0], yExtent[1]] : [0, 1])
                        .range([innerHeight, 0])

                    // Add axes
                    g.append("g")
                        .attr("transform", `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x))

                    g.append("g").call(d3.axisLeft(y))

                    // Add dots
                    g.selectAll("circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("cx", (d: any) => x(d.x))
                        .attr("cy", (d: any) => y(d.y))
                        .attr("r", 5)
                        .attr("fill", chartConfig?.color || "#f59e0b")
                        .attr("opacity", 0.7)
                    break
                }

                case "area": {
                    const xExtent = d3.extent(data, (d: any) => Number(d.x))
                    const yMax = d3.max(data, (d: any) => Number(d.y))

                    const x = d3
                        .scaleLinear()
                        .domain(xExtent[0] !== undefined && xExtent[1] !== undefined ? [xExtent[0], xExtent[1]] : [0, 1])
                        .range([0, innerWidth])

                    const y = d3
                        .scaleLinear()
                        .domain([0, yMax || 1])
                        .range([innerHeight, 0])

                    // Add axes
                    g.append("g")
                        .attr("transform", `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x))

                    g.append("g").call(d3.axisLeft(y))

                    // Add area
                    const area = d3
                        .area<any>()
                        .x((d) => x(d.x))
                        .y0(innerHeight)
                        .y1((d) => y(d.y))

                    g.append("path")
                        .datum(data)
                        .attr("fill", chartConfig?.color || "#8b5cf6")
                        .attr("fill-opacity", 0.3)
                        .attr("d", area)

                    // Add line on top
                    const line = d3
                        .line<any>()
                        .x((d) => x(d.x))
                        .y((d) => y(d.y))

                    g.append("path")
                        .datum(data)
                        .attr("fill", "none")
                        .attr("stroke", chartConfig?.color || "#8b5cf6")
                        .attr("stroke-width", 2)
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
