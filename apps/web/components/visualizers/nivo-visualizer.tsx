"use client";

import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";

interface NivoVisualizerProps {
    data: any;
    type?: "line" | "bar" | "pie";
}

const theme = {
    axis: {
        domain: { line: { stroke: "#64748b", strokeWidth: 1 } },
        ticks: { line: { stroke: "#64748b", strokeWidth: 1 }, text: { fontSize: 10, fill: "#64748b" } },
        legend: { text: { fontSize: 12, fill: "#64748b", fontWeight: "bold" } }
    },
    grid: { line: { stroke: "#e2e8f0", strokeWidth: 1 } },
    tooltip: { container: { background: "#ffffff", color: "#334155", fontSize: 12, borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" } }
};

export function NivoVisualizer({ data, type = "line" }: NivoVisualizerProps) {
    if (!data) return null;

    return (
        <div className="w-full h-[400px] bg-background/50 rounded-2xl border border-border p-4 shadow-inner overflow-hidden">
            {type === "line" && (
                <ResponsiveLine
                    data={data}
                    margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                    xScale={{ type: "point" }}
                    yScale={{ type: "linear", min: "auto", max: "auto", stacked: false, reverse: false }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "X Axis",
                        legendOffset: 36,
                        legendPosition: "middle"
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Y Axis",
                        legendOffset: -40,
                        legendPosition: "middle"
                    }}
                    pointSize={10}
                    pointColor={{ theme: "background" }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "serieColor" }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    theme={theme}
                    colors={{ scheme: "nivo" }}
                    legends={[
                        {
                            anchor: "bottom-right",
                            direction: "column",
                            justify: false,
                            translateX: 100,
                            translateY: 0,
                            itemsSpacing: 0,
                            itemDirection: "left-to-right",
                            itemWidth: 80,
                            itemHeight: 20,
                            itemOpacity: 0.75,
                            symbolSize: 12,
                            symbolShape: "circle",
                            symbolBorderColor: "rgba(0, 0, 0, .5)",
                            effects: [{ on: "hover", style: { itemBackground: "rgba(0, 0, 0, .03)", itemOpacity: 1 } }]
                        }
                    ]}
                />
            )}

            {type === "bar" && (
                <ResponsiveBar
                    data={data}
                    keys={Object.keys(data[0] || {}).filter(k => k !== 'id' && k !== 'label' && k !== 'name')}
                    indexBy="label"
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    padding={0.3}
                    valueScale={{ type: "linear" }}
                    indexScale={{ type: "band", round: true }}
                    colors={{ scheme: "nivo" }}
                    borderRadius={4}
                    theme={theme}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Category",
                        legendOffset: 32,
                        legendPosition: "middle"
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Value",
                        legendOffset: -40,
                        legendPosition: "middle"
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                    legends={[
                        {
                            dataFrom: "keys",
                            anchor: "bottom-right",
                            direction: "column",
                            justify: false,
                            translateX: 120,
                            translateY: 0,
                            itemsSpacing: 2,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemDirection: "left-to-right",
                            itemOpacity: 0.85,
                            symbolSize: 20,
                            effects: [{ on: "hover", style: { itemOpacity: 1 } }]
                        }
                    ]}
                />
            )}

            {type === "pie" && (
                <ResponsivePie
                    data={data}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    colors={{ scheme: "nivo" }}
                    borderWidth={1}
                    borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                    theme={theme}
                />
            )}
        </div>
    );
}
