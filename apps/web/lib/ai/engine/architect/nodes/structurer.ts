import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ArchitectState, CourseStructureSchema } from "../state";
import { AIModelFactory } from "../../../model-factory";

const model = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash",
    temperature: 0.7
});

export const structurerNode = async (state: ArchitectState) => {
    const { topic, level, domainMap } = state;

    console.log(`[LANGGRAPH-V2] 🏗️ Structurer Node: Building syllabus for "${topic}"`);

    if (!domainMap) return { error: "Missing Domain Map" };

    const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are a Course Architect.
     Subject: {topic}
     Level: {level}
     Domain Map: {domainMapJson}
     
     Task: Create a detailed course structure (Modules > Chapters > Concepts).
     Rules:
     - 3-5 Modules.
     - 3-4 Chapters per module.
     - "Neuroscience Sequencing": priming -> core -> application.
     `],
        ["user", "Generate the Course Structure."]
    ]);

    const chain = prompt.pipe(model.withStructuredOutput(CourseStructureSchema));

    try {
        const result = await chain.invoke({
            topic,
            level,
            domainMapJson: JSON.stringify(domainMap)
        });
        return { structure: result };
    } catch (e) {
        console.error("Structurer Node Failed", e);
        return { error: "Failed to generate structure" };
    }
};
