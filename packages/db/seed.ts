import { prisma } from "./index";

async function main() {
    console.log("🌱 Starting database seeding...");

    // 1. Create a demo user
    const user = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: {},
        create: {
            email: "demo@example.com",
            name: "Demo User",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
        },
    });

    console.log(`✅ User created or found: ${user.email} (${user.id})`);

    // 2. Clean up existing courses for this demo user (optional, but good for fresh seeds)
    // await prisma.course.deleteMany({ where: { userId: user.id } });

    // 3. Create a sample "Neuroscience of Learning" course
    const course = await prisma.course.create({
        data: {
            userId: user.id,
            title: "Neuroscience for Learning Systems",
            subject: "Neuroscience",
            goal: "Master how the brain processes, stores, and retrieves information to build better learning software.",
            level: "intermediate",
            status: "READY",
            description: "Explore the biological foundations of memory, attention, and schema formation.",
            modules: {
                create: [
                    {
                        title: "Memory Systems",
                        order: 1,
                        description: "Understand the different types of memory and how they interact during learning.",
                        chapters: {
                            create: [
                                {
                                    title: "Working Memory & Cognitive Load",
                                    order: 1,
                                    estimatedTime: "15 mins",
                                    concepts: {
                                        create: [
                                            {
                                                title: "The 7±2 Rule",
                                                order: 1,
                                                type: "priming",
                                                isReady: true,
                                                content: {
                                                    hook: "Why can't we remember a 20-digit number easily?",
                                                    explanation: "Working memory has a very limited capacity, traditionally thought to be around 7 items.",
                                                    example: "Trying to learn 50 new vocabulary words in one sitting usually fails because of this limit.",
                                                    visual: {
                                                        type: "mermaid",
                                                        code: "graph TD\n  A[Inbound Info] --> B{Working Memory}\n  B --> C[Slot 1]\n  B --> D[Slot 2]\n  B --> E[Slot 3]\n  B --> F[Slot 4]\n  B --> G[Slot 5]\n  B --> H[Slot 6]\n  B --> I[Slot 7]\n  B -- Overflow --> J[Lost Information]",
                                                        caption: "The 'slots' of working memory representing limited capacity."
                                                    }
                                                }
                                            },
                                            {
                                                title: "Cognitive Load Theory",
                                                order: 2,
                                                type: "core",
                                                isReady: true,
                                                content: {
                                                    hook: "Ever felt your brain 'freeze' when a teacher explains something too fast?",
                                                    explanation: "Cognitive load is the total amount of mental effort being used in the working memory. If the load exceeds capacity, learning stops.",
                                                    example: "Complicated UI distracting you from the actual content adds 'extraneous' load.",
                                                    visual: {
                                                        type: "mermaid",
                                                        code: "pie title Cognitive Load Types\n\"Intrinsic (Topic Complexity)\" : 40\n\"Extraneous (UI/Noise)\" : 50\n\"Germane (Deep Processing)\" : 10",
                                                        caption: "Distinguishing between helpful and harmful mental effort."
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        title: "Schema Formation",
                        order: 2,
                        description: "How the brain builds mental maps to store complex information.",
                        chapters: {
                            create: [
                                {
                                    title: "Mental Models & Scaffolding",
                                    order: 1,
                                    estimatedTime: "20 mins",
                                    concepts: {
                                        create: [
                                            {
                                                title: "Neural Schemas",
                                                order: 1,
                                                type: "core",
                                                isReady: true,
                                                content: {
                                                    hook: "Why is it easier to learn a 3rd language than a 2nd?",
                                                    explanation: "Schemas are mental frameworks that help us organize and interpret information. New info sticks to existing schemas.",
                                                    example: "If you know JavaScript, learning TypeScript is faster because you already have a 'Programming' schema."
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    });

    console.log(`✅ Course created: ${course.title} (${course.id})`);
    console.log("✨ Seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:");
        console.error(e);
        process.exit(1);
    });
