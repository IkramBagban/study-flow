Instead of one agent doing everything, we introduce a multi-agent system.

1. 🤖 Agent 1: The Architect
Role: Defines the Map (The Graph).
Output: The list of concepts (e.g., "Event Loop", "Supply & Demand", "Photosynthesis").
2. 🤖 Agent 2: The Director (The Orchestrator) — NEW
Role: The Movie Director.
Input: "Teach 'Supply and Demand'."
Responsibility: It decides the Flow of Components based on the topic type.
If Topic is "System Design": Diagram First → Critique → Explanation.
If Topic is "Philosophy": Story (Hook) → Reflection → Concept.
If Topic is "Math": Problem First → Visual Proof → Formula.
Output: A list of Tasks for the specialists.
[ { role: 'Visualizer', type: 'recharts-line' }, { role: 'Writer', type: 'explanation' } ]
3. 🤖 Agent 3: The Visualizer (Formerly Illustrator) — UPGRADED
Role: The Multi-Tool Designer.
Responsibility: It receives a request like "Visualize X" and autonomous decides the best tool:
Mermaid: For flows, sequences, state machines (Process).
Recharts: For data, trends, math, economics (Quantifiable).
SVG/D3: For custom shapes, anatomy, or physics (Spatial).
HTML/CSS: For UI mockups or simple box models.
Constraint: It must output code that our frontend "Block Renderer" can handle.
4. 🤖 Agent 4 & 5 (Professor & Inquisitor)
These remain specialists, but they now take orders from the Director on tone and length.
How this changes your Data Structure
We move from a "Fixed Schema" content to a "Block-Based" Schema.

Old Way (Fixed):

{
  "hook": "...",
  "explanation": "...",
  "diagram": "..."
}
New Way (Dynamic):

// The "content" field in your DB becomes an Array of Blocks
[
  {
    "type": "visual",
    "tool": "recharts",
    "code": "<LineChart ... />",
    "caption": "See how price drops as supply rises?"
  },
  {
    "type": "prediction_question",
    "text": "Based on this chart, what happens at point X?"
  },
  {
    "type": "text",
    "variant": "explanation",
    "content": "This is called the equilibrium point..."
  }
]
The "Agentic Workflow" for your Code
Cartographer creates the LearningNode.
Director looks at the Node Title + Description.
Thought: "This is a structural concept. I need a diagram first."
Plan: [Visual, Question, Text]
Director calls the Visualizer:
Prompt: "Create a visual for X. Choose the best tool (Mermaid vs Recharts)."
Visualizer: "I'll use Mermaid because it's a flowchart." -> Generates Code.
Director calls the Professor:
Prompt: "Write an explanation that references the Mermaid diagram we just made."
Why this is better?
No Boredom: The user never knows if they will get a quiz, a chart, or a story next.
Right Tool for the Job: We don't force a Mermaid flowchart for a Math problem (where Recharts is better).
Context Aware: The text explicitly references the visual because the Director coordinates them.