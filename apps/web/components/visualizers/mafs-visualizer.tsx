"use client";

import { Mafs, Coordinates, Plot, Vector, Circle, Point, Polygon, Line, Text, Transform } from "mafs";
import JsxParser from "react-jsx-parser";
import * as math from "mathjs";
import { AlertCircle } from "lucide-react";

interface MafsVisualizerProps {
    code: string;
}

// --- Structured Schema Definition (Matched with AI Generator) ---
interface StructuredMafsData {
    type: "plot" | "coordinate";
    items: Array<{
        type: "function" | "point" | "line" | "text" | "vector" | "circle";
        // Function props
        expression?: string;
        color?: string;
        label?: string;
        // Point props
        x?: number;
        y?: number;
        // Line props
        x1?: number;
        y1?: number;
        x2?: number;
        y2?: number;
        // Text props
        content?: string;
        // Vector props
        tail?: [number, number];
        tip?: [number, number];
        // Circle props
        center?: [number, number];
        radius?: number;
    }>;
    domain?: { x: [number, number]; y: [number, number] };
    labels?: { x: string; y: string };
}

// --- Safe Component Wrappers for Text/JSX ---
const mathFn = (expr: any, varName: string = 'x') => {
    if (typeof expr !== 'string') return expr;
    try {
        const compiled = math.compile(expr);
        return (val: number) => {
            try {
                return compiled.evaluate({ [varName]: val, x: val, t: val, θ: val });
            } catch { return 0; }
        };
    } catch (e) {
        console.warn("MathJS Parse Error:", e);
        return () => 0;
    }
};

const SafePlotOfX = (props: any) => <Plot.OfX {...props} y={mathFn(props.y || props.fn, 'x')} />;
const SafePlotOfY = (props: any) => <Plot.OfY {...props} x={mathFn(props.x || props.fn, 'y')} />;
const SafeParametric = (props: any) => {
    const xFn = mathFn(props.x || props.expression?.[0] || props.xy?.[0], 't');
    const yFn = mathFn(props.y || props.expression?.[1] || props.xy?.[1], 't');
    return <Plot.Parametric {...props} x={xFn} y={yFn} />;
};

export function MafsVisualizer({ code }: MafsVisualizerProps) {
    if (!code) return null;

    // --- 1. Try to Parse Structured JSON ---
    let structuredData: StructuredMafsData | null = null;
    try {
        if (code.trim().startsWith('{')) {
            structuredData = JSON.parse(code);
        }
    } catch (e) {
        // Not JSON, fall back to JSX Parser
    }

    // --- 2. Render Structured Data (Robust Mode) ---
    if (structuredData) {
        const { domain, items, labels } = structuredData;
        const xMin = domain?.x?.[0] ?? -5;
        const xMax = domain?.x?.[1] ?? 5;
        const yMin = domain?.y?.[0] ?? -5;
        const yMax = domain?.y?.[1] ?? 5;

        return (
            <div className="w-full bg-background/50 rounded-xl overflow-hidden border border-border/50 shadow-sm p-4">
                <Mafs viewBox={{ x: [xMin, xMax], y: [yMin, yMax] }} height={400} preserveAspectRatio="contain">
                    <Coordinates.Cartesian
                        subdivisions={2}
                        xAxis={{ labels: (n) => n % 1 === 0 ? n : "" }}
                        yAxis={{ labels: (n) => n % 1 === 0 ? n : "" }}
                    />
                    {items.map((item, idx) => {
                        switch (item.type) {
                            case "function":
                                return <SafePlotOfX key={idx} y={item.expression} color={item.color} />;
                            case "point":
                                return <Point key={idx} x={item.x ?? 0} y={item.y ?? 0} color={item.color} />;
                            case "line":
                                return <Line.Segment key={idx} point1={[item.x1 ?? 0, item.y1 ?? 0]} point2={[item.x2 ?? 0, item.y2 ?? 0]} color={item.color} />;
                            case "text":
                                return <Text key={idx} x={item.x ?? 0} y={item.y ?? 0} color={item.color ?? "black"}>{item.content}</Text>;
                            case "vector":
                                return <Vector key={idx} tail={item.tail ?? [0, 0]} tip={item.tip ?? [1, 1]} color={item.color} />;
                            case "circle":
                                return <Circle key={idx} center={item.center ?? [0, 0]} radius={item.radius ?? 1} color={item.color} />;
                            default:
                                return null;
                        }
                    })}
                    {labels && (
                        <>
                            <Text x={xMax - 1} y={0.5} >{labels.x}</Text>
                            <Text x={0.5} y={yMax - 1} >{labels.y}</Text>
                        </>
                    )}
                </Mafs>
            </div>
        );
    }

    // --- 3. Render Raw Code (Legacy/Fallback Mode) ---
    // This uses JsxParser for backward compatibility or complex custom text
    const cleanCode = code.replace(/```(jsx|javascript|typescript)?/g, "").replace(/```/g, "").trim();

    const mafsComponents = {
        Mafs,
        Plot: { OfX: SafePlotOfX, OfY: SafePlotOfY, Parametric: SafeParametric },
        Coordinates: { Cartesian: Coordinates.Cartesian, Polar: Coordinates.Polar },
        Cartesian: Coordinates.Cartesian, Polar: Coordinates.Polar,
        OfX: SafePlotOfX, OfY: SafePlotOfY, Parametric: SafeParametric,
        Vector, Circle, Point, Polygon, Line, Text, Transform,
        LaTeX: Text, MathLatex: Text // Alias hallucinated names
    };

    return (
        <div className="w-full bg-background/50 rounded-xl overflow-hidden border border-border/50 shadow-sm transition-all hover:border-primary/20 p-2">
            <JsxParser
                bindings={{ Math, radius: 1, height: 1, t: 0, PI: Math.PI, E: Math.E }}
                components={mafsComponents as any}
                jsx={cleanCode.includes('<Mafs') ? cleanCode : `<Mafs viewBox={{ x: [-5, 5], y: [-5, 5] }} height={400} preserveAspectRatio="contain" className="w-full">${cleanCode}</Mafs>`}
                renderInWrapper={false}
                onError={(err) => console.error("Mafs Render Error:", err)}
            />
        </div>
    );
}
