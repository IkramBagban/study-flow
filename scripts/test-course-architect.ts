
// Mock environment variables since we are running a standalone script
process.env.GOOGLE_GENERATIVE_AI_API_KEY = "dummy-key-for-test-structure-only-unless-loaded";

// We need to actually load the env vars if we want real output, 
// but for a "dry run" of the graph structure, we just need to ensure imports work.
// To fully test generation, we need the real key. 
// Assuming the user runs this with `bun run scripts/test-architect.ts` and bun loads .env automatically.

import { courseArchitectGraph } from "../apps/web/lib/ai/engine/architect/graph";

async function main() {
    console.log("🚀 Starting Course Architect Test...");

    // Test Input
    const inputState = {
        topic: "Introduction to Quantum Physics",
        goal: "Understand the basics of wave-particle duality and Schrödinger's equation.",
        level: "Beginner",
        domainMap: null,
        structure: null,
        error: null
    };

    console.log("Input State:", inputState);

    try {
        const result = await courseArchitectGraph.invoke(inputState);

        console.log("\n✅ Graph Execution Completed!");
        console.log("-----------------------------------------");

        if (result.error) {
            console.error("❌ Error reported by graph:", result.error);
        } else {
            console.log("📘 Domain Map Generated:");
            console.log(JSON.stringify(result.domainMap?.keyConcepts, null, 2));

            console.log("\n📚 Course Structure Generated:");
            console.log(`Modules: ${result.structure?.modules.length}`);
            result.structure?.modules.forEach((m, i) => {
                console.log(`  Module ${i + 1}: ${m.title}`);
                m.chapters.forEach(c => console.log(`    - ${c.title}`));
            });
        }
    } catch (error) {
        console.error("❌ Critical Graph Failure:", error);
    }
}

main();
