"use client";

import { useEffect, useRef } from "react";
import SmilesDrawer from "smiles-drawer";
import { FlaskConical, Beaker, Atom } from "lucide-react";

interface ChemistryVisualizerProps {
    smiles: string;
}

export function ChemistryVisualizer({ smiles }: ChemistryVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !smiles) return;

        try {
            const options = {
                width: 400,
                height: 300,
                bondThickness: 1.5,
                bondLength: 20,
                fontSizeLarge: 10,
                fontSizeSmall: 7,
                padding: 10,
                terminalCarbons: true,
                explicitHydrogens: false
            };

            const smilesDrawer = new SmilesDrawer.SmiDrawer(options);

            // Clear previous drawing
            const context = canvasRef.current.getContext('2d');
            if (context) context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            SmilesDrawer.parse(smiles, (tree: any) => {
                smilesDrawer.draw(tree, canvasRef.current!, 'light', false);
            }, (err: any) => {
                console.error("SMILES Error:", err);
            });
        } catch (err) {
            console.error("SMILES Drawer Init Error:", err);
        }
    }, [smiles]);

    if (!smiles) return null;

    return (
        <div className="w-full max-w-lg mx-auto p-6 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border shadow-inner relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000">
                <Atom className="size-48 rotate-12" />
            </div>

            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <FlaskConical className="size-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Molecular Structure</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Rendered via SMILES</p>
                    </div>
                </div>

                <div className="flex justify-center bg-white/80 rounded-xl p-4 shadow-sm border border-border/50">
                    <canvas
                        ref={canvasRef}
                        width="400"
                        height="300"
                        className="max-sm:w-full h-auto"
                    />
                </div>

                <div className="p-3 rounded-lg bg-background/50 border border-border font-mono text-[10px] break-all text-muted-foreground">
                    SMILES: {smiles}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 text-[10px] text-muted-foreground/60 flex items-center gap-2">
                <Beaker className="size-3" />
                <span>Interactive 2D Bond Model</span>
            </div>
        </div>
    );
}
