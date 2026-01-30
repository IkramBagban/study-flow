import { StateGraph, END, START } from "@langchain/langgraph";
import { ArchitectAnnotation } from "./state";
import { analyzerNode } from "./nodes/analyzer";
import { structurerNode } from "./nodes/structurer";

// 1. Initialize
const workflow = new StateGraph(ArchitectAnnotation);

// 2. Add Nodes
workflow.addNode("analyzing", analyzerNode);
workflow.addNode("structuring", structurerNode);

// 3. Define Edges
workflow.addEdge(START, "analyzing");
workflow.addEdge("analyzing", "structuring");
workflow.addEdge("structuring", END);

// 4. Compile
export const courseArchitectGraph = workflow.compile();
