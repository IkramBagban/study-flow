'use client'

import React, { useState } from "react";
import { Mafs, Coordinates, Plot, Point, Text } from "mafs";
import "mafs/core.css";

export default function ParametricCurvesDemo() {
    const [t, setT] = useState(3.14);
    const [a, setA] = useState(2);
    const [b, setB] = useState(3);

    // Lissajous Curve: x = sin(at), y = cos(bt)
    const lissajousX = (t) => Math.sin(a * t);
    const lissajousY = (t) => Math.cos(b * t);

    // Spiral: x = t*cos(t), y = t*sin(t)
    const spiralX = (t) => (t / 3) * Math.cos(t);
    const spiralY = (t) => (t / 3) * Math.sin(t);

    // Cycloid: x = t - sin(t), y = 1 - cos(t)
    const cycloidX = (t) => (t - Math.sin(t)) / 2;
    const cycloidY = (t) => (1 - Math.cos(t)) / 2 - 1.5;

    // Butterfly Curve
    const butterflyR = (t) => Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin(t / 12), 5);
    const butterflyX = (t) => butterflyR(t) * Math.sin(t) / 2;
    const butterflyY = (t) => butterflyR(t) * Math.cos(t) / 2;

    return (
        <div style={{
            padding: "20px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            maxWidth: "1000px",
            margin: "0 auto",
            background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)",
            minHeight: "100vh"
        }}>
            <h1 style={{ marginBottom: "10px", color: "#2c3e50" }}>
                📐 Parametric Curves Visualization
            </h1>
            <p style={{ color: "#666", marginBottom: "25px", fontSize: "16px" }}>
                Explore beautiful mathematical curves defined by parametric equations
            </p>

            {/* Controls */}
            <div style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "25px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px"
                }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>
                            Time (t): {t.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="12.56"
                            step="0.1"
                            value={t}
                            onChange={(e) => setT(parseFloat(e.target.value))}
                            style={{ width: "100%", accentColor: "#3498db" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>
                            Parameter A: {a}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={a}
                            onChange={(e) => setA(parseFloat(e.target.value))}
                            style={{ width: "100%", accentColor: "#e74c3c" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>
                            Parameter B: {b}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={b}
                            onChange={(e) => setB(parseFloat(e.target.value))}
                            style={{ width: "100%", accentColor: "#9b59b6" }}
                        />
                    </div>
                </div>
            </div>

            {/* Visualization */}
            <div style={{
                border: "3px solid #34495e",
                borderRadius: "12px",
                overflow: "hidden",
                background: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}>
                <Mafs
                    width={900}
                    height={650}
                    viewBox={{ x: [-4, 4], y: [-3, 3] }}
                >
                    <Coordinates.Cartesian
                        subdivisions={2}
                        xAxis={{ lines: 1, labels: (n) => (n === 0 ? "" : n) }}
                        yAxis={{ lines: 1, labels: (n) => (n === 0 ? "" : n) }}
                    />

                    {/* Lissajous Curve */}
                    <Plot.Parametric
                        xy={(t) => [lissajousX(t), lissajousY(t)]}
                        t={[0, 2 * Math.PI]}
                        color="#e74c3c"
                        weight={3}
                    />
                    <Point x={lissajousX(t)} y={lissajousY(t)} color="#e74c3c" />
                    <Text x={1.5} y={2.5} color="#e74c3c" size={16} weight="bold">
                        Lissajous
                    </Text>

                    {/* Spiral */}
                    <Plot.Parametric
                        xy={(t) => [spiralX(t), spiralY(t)]}
                        t={[0, 4 * Math.PI]}
                        color="#3498db"
                        weight={3}
                    />
                    <Point x={spiralX(t)} y={spiralY(t)} color="#3498db" />
                    <Text x={-3.5} y={2.5} color="#3498db" size={16} weight="bold">
                        Spiral
                    </Text>

                    {/* Cycloid */}
                    <Plot.Parametric
                        xy={(t) => [cycloidX(t), cycloidY(t)]}
                        t={[0, 4 * Math.PI]}
                        color="#2ecc71"
                        weight={3}
                    />
                    <Point x={cycloidX(t)} y={cycloidY(t)} color="#2ecc71" />
                    <Text x={-3.5} y={-2.5} color="#2ecc71" size={16} weight="bold">
                        Cycloid
                    </Text>

                    {/* Butterfly Curve */}
                    <Plot.Parametric
                        xy={(t) => [butterflyX(t), butterflyY(t)]}
                        t={[0, 12 * Math.PI]}
                        color="#9b59b6"
                        weight={2.5}
                    />
                    <Text x={2} y={-2.3} color="#9b59b6" size={16} weight="bold">
                        Butterfly
                    </Text>
                </Mafs>
            </div>

            {/* Equations Panel */}
            <div style={{
                marginTop: "25px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "15px"
            }}>
                <div style={{
                    background: "#ffe6e6",
                    padding: "15px",
                    borderRadius: "10px",
                    border: "2px solid #e74c3c"
                }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#c0392b" }}>Lissajous</h4>
                    <code style={{ fontSize: "13px", color: "#555" }}>
                        x = sin({a}t)<br />
                        y = cos({b}t)
                    </code>
                </div>

                <div style={{
                    background: "#e6f2ff",
                    padding: "15px",
                    borderRadius: "10px",
                    border: "2px solid #3498db"
                }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#2980b9" }}>Spiral</h4>
                    <code style={{ fontSize: "13px", color: "#555" }}>
                        x = (t/3)·cos(t)<br />
                        y = (t/3)·sin(t)
                    </code>
                </div>

                <div style={{
                    background: "#e6ffe6",
                    padding: "15px",
                    borderRadius: "10px",
                    border: "2px solid #2ecc71"
                }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#27ae60" }}>Cycloid</h4>
                    <code style={{ fontSize: "13px", color: "#555" }}>
                        x = (t - sin(t))/2<br />
                        y = (1 - cos(t))/2
                    </code>
                </div>

                <div style={{
                    background: "#f3e6ff",
                    padding: "15px",
                    borderRadius: "10px",
                    border: "2px solid #9b59b6"
                }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#8e44ad" }}>Butterfly</h4>
                    <code style={{ fontSize: "13px", color: "#555" }}>
                        Polar form with<br />
                        complex exponential
                    </code>
                </div>
            </div>

            <div style={{
                marginTop: "20px",
                padding: "18px",
                background: "white",
                borderRadius: "10px",
                border: "2px solid #95a5a6",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
            }}>
                <p style={{ margin: 0, color: "#555", fontSize: "15px", lineHeight: "1.6" }}>
                    <strong>💡 Tip:</strong> Adjust the time slider to animate points along each curve.
                    Parameters A and B control the frequency ratio of the Lissajous curve, creating different patterns!
                </p>
            </div>
        </div>
    );
}