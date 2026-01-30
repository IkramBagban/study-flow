import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ArchitectState, DomainMapSchema } from "../state";
import { AIModelFactory } from "../../../model-factory";

const model = AIModelFactory.createModel({
    provider: "google",
    model: "gemini-2.0-flash",
    temperature: 0.7
});

export const analyzerNode = async (state: ArchitectState) => {
    const { topic, goal, sourceText } = state;

    console.log(`[LANGGRAPH-V2] 🧠 Analyzer Node: Mapping domain for "${topic}"`);

    const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are an expert curriculum designer.
     Objective: Create a "Domain Map" for the subject: {topic}.
     Goal: {goal}.
     
     Break the subject into 4-7 core "Topic Groups".
     List 5-10 "Key Concepts".
     ${sourceText ? "Prioritize concepts found in the Source Material: {sourceText}" : ""}
     `],
        ["user", "Generate the Domain Map."]
    ]);

    const chain = prompt.pipe(model.withStructuredOutput(DomainMapSchema));

    try {
        const result = await chain.invoke({
            topic,
            goal,
            sourceText: sourceText ? sourceText.substring(0, 4000) : ""
        });
        return { domainMap: result };
    } catch (e) {
        console.error("Analyzer Node Failed", e);
        return { error: "Failed to generate domain map" };
    }
};
