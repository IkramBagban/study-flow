"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Plus,
    X,
    Check,
    BookOpen,
    Sparkles,
    CheckCircle2,
    XCircle,
    ArrowRight,
    ChevronLeft
} from "lucide-react"

type Step =
    | "initial"
    | "discovery" // Topic & Level
    | "checkpoint" // Prior knowledge list
    | "assessment" // Quiz
    | "summary"    // Knowledge Profile

const SUGGESTIONS = [
    "Language Learning", "Music Theory", "Photography Basics",
    "Cooking Techniques", "Personal Finance", "Creative Writing"
]

const LEVELS = [
    { id: "new", title: "New to this", desc: "I'm starting fresh", icon: BookOpen },
    { id: "some", title: "Some background", desc: "I know the basics", icon: Sparkles },
    { id: "well", title: "Know it well", desc: "I want to go deeper", icon: CheckCircle2 },
]

const CHECKPOINT_ITEMS = [
    "I understand the fundamental syntax and concepts.",
    "I can explain the difference between synchronous and asynchronous code.",
    "I've worked with state management in small projects.",
    "I am familiar with common design patterns."
]

const QUIZ_DATA = [
    {
        question: "Which of the following best describes 'Lifting State Up'?",
        options: [
            "Moving state to a child component",
            "Moving state to the nearest common ancestor",
            "Using Redux for all state",
            "Keeping state local to the input"
        ],
        answer: 1
    },
    {
        question: "What is the primary purpose of the 'useEffect' hook?",
        options: [
            "To handle user clicks exclusively",
            "To perform side effects in functional components",
            "To create a new component",
            "To style the component"
        ],
        answer: 1
    }
]

export function CreateCourseFlow() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [step, setStep] = React.useState<Step>("discovery")
    const [topic, setTopic] = React.useState("")
    const [selectedLevel, setSelectedLevel] = React.useState("new")

    const [checkpointResponses, setCheckpointResponses] = React.useState<Record<number, boolean>>({})
    const [quizResponses, setQuizResponses] = React.useState<Record<number, number>>({})
    const [summaryResponses, setSummaryResponses] = React.useState<Record<number, boolean>>({})

    const reset = () => {
        setIsOpen(false)
        setStep("discovery")
        setTopic("")
        setSelectedLevel("new")
        setCheckpointResponses({})
        setQuizResponses({})
        setSummaryResponses({})
    }

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} className="gap-2">
                <Plus size={16} /> New Course
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card w-full max-w-2xl border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                role="dialog"
            >
                {/* Header */}
                <div className="flex flex-col border-b border-border">
                    <div className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                                <GalleryVerticalEnd size={14} />
                            </div>
                            <span className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Create Course</span>
                        </div>
                        <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex h-1 bg-secondary w-full">
                        <div
                            className="bg-primary transition-all duration-500 ease-in-out h-full"
                            style={{
                                width: step === "discovery" ? "25%" :
                                    step === "checkpoint" ? "50%" :
                                        step === "assessment" ? "75%" : "100%"
                            }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto max-h-[70vh]">
                    {step === "discovery" && (
                        <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <h2 className="text-lg font-semibold tracking-tight">What do you want to learn about?</h2>
                                    <div className="relative">
                                        <Input
                                            placeholder='e.g., "Photosynthesis"'
                                            className="h-12 text-base bg-background"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {SUGGESTIONS.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setTopic(s)}
                                                className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors bg-secondary/30"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h2 className="text-lg font-semibold tracking-tight">What do you already know about this?</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {LEVELS.map(level => {
                                            const Icon = level.icon
                                            const isSelected = selectedLevel === level.id
                                            return (
                                                <button
                                                    key={level.id}
                                                    onClick={() => setSelectedLevel(level.id)}
                                                    className={cn(
                                                        "flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all group",
                                                        isSelected
                                                            ? "border-primary bg-primary/[0.02]"
                                                            : "border-border hover:border-border/80 bg-background"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                                                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
                                                    )}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <h3 className="font-semibold text-sm">{level.title}</h3>
                                                    <p className="text-xs text-muted-foreground mt-1">{level.desc}</p>
                                                    <div className={cn(
                                                        "ml-auto mt-2 h-4 w-4 rounded-full border flex items-center justify-center",
                                                        isSelected ? "border-primary bg-primary" : "border-border"
                                                    )}>
                                                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-secondary/40 rounded-xl p-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-primary/20 flex items-center justify-center">
                                    <Sparkles size={16} className="text-primary" />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    StudyFlow will personalize your materials from foundational concepts through advanced mastery based on your profile.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === "checkpoint" && (
                        <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-semibold tracking-tight">Checking your understanding...</h2>
                                <p className="text-muted-foreground text-sm">Tell us which of these you already grasp.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {CHECKPOINT_ITEMS.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background group hover:border-primary/20 transition-colors">
                                        <span className="text-sm font-medium">{item}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCheckpointResponses(prev => ({ ...prev, [i]: false }))}
                                                className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                                    checkpointResponses[i] === false ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                                )}
                                            >
                                                <X size={16} />
                                            </button>
                                            <button
                                                onClick={() => setCheckpointResponses(prev => ({ ...prev, [i]: true }))}
                                                className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                                    checkpointResponses[i] === true ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                                )}
                                            >
                                                <Check size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "assessment" && (
                        <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-semibold tracking-tight">Let&apos;s verify your skills</h2>
                                <p className="text-muted-foreground text-sm">Answer these quick questions to calibrate your learning path.</p>
                            </div>

                            <div className="flex flex-col gap-8">
                                {QUIZ_DATA.map((q, qIndex) => (
                                    <div key={qIndex} className="flex flex-col gap-4">
                                        <span className="text-xs font-semibold uppercase tracking-widest text-primary/60">Question {qIndex + 1}</span>
                                        <h3 className="text-lg font-medium leading-snug">{q.question}</h3>
                                        <div className="grid gap-2">
                                            {q.options.map((opt, oIndex) => {
                                                const isSelected = quizResponses[qIndex] === oIndex
                                                return (
                                                    <button
                                                        key={oIndex}
                                                        onClick={() => setQuizResponses(prev => ({ ...prev, [qIndex]: oIndex }))}
                                                        className={cn(
                                                            "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                                                            isSelected ? "border-primary bg-primary/[0.02] ring-1 ring-primary" : "border-border hover:bg-secondary/30"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-5 w-5 rounded-full border flex items-center justify-center",
                                                            isSelected ? "border-primary bg-primary text-white" : "border-border"
                                                        )}>
                                                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-sm">{opt}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "summary" && (
                        <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-semibold tracking-tight">My understanding of your level</h2>
                                <p className="text-muted-foreground text-sm">Based on your responses, here is what I&apos;ve mapped out. Correct me if I&apos;m wrong.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {[
                                    "You have a solid grasp of basic component architecture.",
                                    "You are comfortable with simple hooks like useState.",
                                    "You might need more practice with complex state synchronization.",
                                    "Deep dive into performance optimizations is recommended."
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-border bg-background shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="h-5 w-5 mt-0.5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className="text-sm font-medium leading-relaxed">{item}</span>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => setSummaryResponses(prev => ({ ...prev, [i]: false }))}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1.5",
                                                    summaryResponses[i] === false ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground"
                                                )}
                                            >
                                                <XCircle size={14} /> Wrong
                                            </button>
                                            <button
                                                onClick={() => setSummaryResponses(prev => ({ ...prev, [i]: true }))}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1.5",
                                                    summaryResponses[i] === true ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                                )}
                                            >
                                                <CheckCircle2 size={14} /> Correct
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border bg-secondary/10 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (step === "discovery") reset()
                            else if (step === "checkpoint") setStep("discovery")
                            else if (step === "assessment") setStep("checkpoint")
                            else if (step === "summary") setStep("assessment")
                        }}
                    >
                        {step === "discovery" ? "Cancel" : <><ChevronLeft size={16} className="mr-2" /> Back</>}
                    </Button>

                    <Button
                        disabled={step === "discovery" && !topic}
                        onClick={() => {
                            if (step === "discovery") setStep("checkpoint")
                            else if (step === "checkpoint") setStep("assessment")
                            else if (step === "assessment") setStep("summary")
                            else if (step === "summary") {
                                // Finalize - redirect or show success
                                reset()
                            }
                        }}
                        className="px-8 min-w-[120px]"
                    >
                        {step === "summary" ? "Proceed to Course" : "Continue"}
                        {step !== "summary" && <ArrowRight size={16} className="ml-2" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function GalleryVerticalEnd(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7 2h10" />
            <path d="M5 6h14" />
            <rect width="18" height="12" x="3" y="10" rx="2" />
        </svg>
    )
}
