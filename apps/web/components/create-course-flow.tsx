"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import {
    Plus,
    X,
    Check,
    BookOpen,
    Sparkles,
    CheckCircle2,
    XCircle,
    ArrowRight,
    ChevronLeft,
    Loader2,
    Upload,
    Link2,
    HardDrive,
    FileText,
    ChevronRight,
    Search
} from "lucide-react"

type Step =
    | "source"     // NEW: Resource selection
    | "discovery"  // Topic & Level
    | "checkpoint" // Concept extraction check
    | "assessment" // Diagnostic Quiz
    | "summary"    // Knowledge Profile Judgment

const SUGGESTIONS = [
    "Language Learning", "Music Theory", "Photography Basics",
    "Cooking Techniques", "Personal Finance", "Creative Writing"
]

const LEVELS = [
    { id: "new", title: "New to this", desc: "I'm starting fresh", icon: BookOpen },
    { id: "some", title: "Some background", desc: "I know the basics", icon: Sparkles },
    { id: "well", title: "Know it well", desc: "I want to go deeper", icon: CheckCircle2 },
]

const STORAGE_KEY = "studyflow_wizard_state";

export function CreateCourseFlow({ trigger }: { trigger?: React.ReactNode }) {
    const router = useRouter()
    const [isOpen, setIsOpen] = React.useState(false)
    const [step, setStep] = React.useState<Step>("source")
    const [isLoading, setIsLoading] = React.useState(false)

    // Form Data
    const [topic, setTopic] = React.useState("")
    const [selectedLevel, setSelectedLevel] = React.useState("new")
    const [sourceText, setSourceText] = React.useState("")

    // Generated Data
    const [conceptChecks, setConceptChecks] = React.useState<string[]>([])
    const [diagnosticQuestions, setDiagnosticQuestions] = React.useState<any[]>([])
    const [judgments, setJudgments] = React.useState<string[]>([])

    // User Responses
    const [checkpointResponses, setCheckpointResponses] = React.useState<Record<string, boolean>>({}) // Concept -> Known?
    const [quizResponses, setQuizResponses] = React.useState<Record<string, number>>({}) // QuestionId -> OptionIdx
    const [summaryResponses, setSummaryResponses] = React.useState<Record<number, boolean>>({}) // JudgmentIdx -> Correct?

    // Load from LocalStorage
    React.useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setStep(data.step || "source");
                setTopic(data.topic || "");
                setSelectedLevel(data.selectedLevel || "new");
                setSourceText(data.sourceText || "");
                setConceptChecks(data.conceptChecks || []);
                setDiagnosticQuestions(data.diagnosticQuestions || []);
                setJudgments(data.judgments || []);
                setCheckpointResponses(data.checkpointResponses || {});
                setQuizResponses(data.quizResponses || {});
                setSummaryResponses(data.summaryResponses || {});

                // Auto-open if we were in the middle of something
                if (data.step && data.step !== "source") {
                    setIsOpen(true);
                }
            } catch (e) {
                console.error("Failed to load saved state", e);
            }
        }
    }, []);

    // Save to LocalStorage
    React.useEffect(() => {
        const state = {
            step,
            topic,
            selectedLevel,
            sourceText,
            conceptChecks,
            diagnosticQuestions,
            judgments,
            checkpointResponses,
            quizResponses,
            summaryResponses
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [step, topic, selectedLevel, sourceText, conceptChecks, diagnosticQuestions, judgments, checkpointResponses, quizResponses, summaryResponses]);

    const reset = () => {
        setIsOpen(false)
        setStep("source")
        setTopic("")
        setSelectedLevel("new")
        setSourceText("")
        setCheckpointResponses({})
        setQuizResponses({})
        setConceptChecks([])
        setDiagnosticQuestions([])
        setJudgments([])
        setSummaryResponses({})
        setIsLoading(false)
        localStorage.removeItem(STORAGE_KEY);
    }

    const handleGenerateDomain = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/ai/course/generate", {
                method: "POST",
                body: JSON.stringify({
                    topic,
                    goal: "Master the core concepts based on provided materials",
                    level: selectedLevel,
                    sourceText,
                    action: "domain-map"
                })
            })
            const data = await res.json()
            if (data.keyConcepts) {
                setConceptChecks(data.keyConcepts)
                setStep("checkpoint")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGenerateAssessment = async () => {
        setIsLoading(true)
        try {
            const knownConcepts = Object.entries(checkpointResponses)
                .filter(([_, known]) => known)
                .map(([concept]) => concept)

            const res = await fetch("/api/ai/course/generate", {
                method: "POST",
                body: JSON.stringify({
                    topic,
                    goal: "Verify knowledge and identify gaps",
                    level: selectedLevel,
                    sourceText,
                    action: "assess",
                    concepts: knownConcepts
                })
            })
            const data = await res.json()
            if (data.questions) {
                setDiagnosticQuestions(data.questions)
                setStep("assessment")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFinishAssessment = () => {
        // Here we'd ideally hit an AI to generate the "Judgment" list.
        // For v1, let's derive some basic judgments or use a mock list that feels real.
        // In a real implementation, we'd have a specific API for "Inference/Judgment".

        const correctCount = diagnosticQuestions.filter(q => {
            const selectedIdx = quizResponses[q.id];
            if (selectedIdx === undefined) return false;
            const selectedOption = q.options[selectedIdx];
            return selectedOption?.id === q.correctOptionId;
        }).length;

        const mockJudgments = [
            `You have a ${correctCount > 2 ? 'strong' : 'developing'} grasp of the core principles mentioned.`,
            `Based on your concept check, you seem comfortable with: ${Object.entries(checkpointResponses).filter(([_, k]) => k).map(([c]) => c).slice(0, 2).join(", ") || "the fundamentals"}.`,
            `We've identified some potential gaps in "${topic}" that we'll focus on.`,
            `Your profile suggests an active, application-focused learning style for this topic.`
        ];

        setJudgments(mockJudgments);
        setStep("summary");
    }

    const handleCreateCourse = async () => {
        setIsLoading(true)
        try {
            const quizResults = diagnosticQuestions.map(q => {
                const selectedIdx = quizResponses[q.id]
                if (selectedIdx === undefined) return { questionId: q.id, correct: false }
                const selectedOption = q.options[selectedIdx]
                const isCorrect = selectedOption?.id === q.correctOptionId || false
                return { questionId: q.id, correct: isCorrect }
            })

            const knownConcepts = Object.entries(checkpointResponses)
                .filter(([_, known]) => known)
                .map(([concept]) => concept)

            const res = await fetch("/api/ai/course/generate", {
                method: "POST",
                body: JSON.stringify({
                    topic,
                    goal: "Personalized deep learning based on assessment",
                    level: selectedLevel,
                    sourceText,
                    action: "course-structure",
                    assessmentData: {
                        quizResults,
                        knownConcepts
                    }
                })
            })
            const data = await res.json()
            if (data.courseId) {
                reset(); // Clear storage
                router.push(`/course/${data.courseId}`)
            }
        } catch (e) {
            console.error(e)
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        if (trigger) {
            return (
                <div onClick={() => setIsOpen(true)}>
                    {trigger}
                </div>
            )
        }
        return (
            <Button onClick={() => setIsOpen(true)} className="gap-2">
                <Plus size={16} /> New Course
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card w-full max-w-2xl border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]"
                role="dialog"
            >
                {/* Header */}
                <div className="flex flex-col border-b border-border">
                    <div className="flex items-center justify-between p-6 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                                <Sparkles size={14} />
                            </div>
                            <span className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Adaptive Generation</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex h-1 bg-secondary w-full">
                        <div
                            className="bg-primary transition-all duration-500 ease-in-out h-full"
                            style={{
                                width: step === "source" ? "15%" :
                                    step === "discovery" ? "35%" :
                                        step === "checkpoint" ? "55%" :
                                            step === "assessment" ? "75%" : "100%"
                            }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto scrollbar-hide flex-1">
                    {step === "source" && (
                        <div className="flex flex-col gap-10 text-center animate-in zoom-in-95 duration-500">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-semibold tracking-tight">
                                    What do you want to <br />
                                    <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                        learn today?
                                    </span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                <SourceButton icon={Upload} label="Upload files" disabled />
                                <SourceButton icon={Link2} label="Websites" iconColor="text-red-400" disabled />
                                <SourceButton icon={HardDrive} label="Drive" iconColor="text-blue-400" disabled />
                                <SourceButton
                                    icon={FileText}
                                    label="Paste Text"
                                    iconColor="text-emerald-400"
                                    active={true}
                                />
                            </div>

                            <div className="flex flex-col gap-2 text-left">
                                <label className="text-xs font-medium text-muted-foreground uppercase ml-1">Paste Source Material</label>
                                <textarea
                                    className="w-full h-48 rounded-xl bg-secondary/30 border border-border p-4 text-sm focus:ring-2 focus:ring-primary/20 resize-none font-mono outline-none"
                                    placeholder="Paste the content, notes, or article you want to learn from..."
                                    value={sourceText}
                                    onChange={(e) => setSourceText(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground text-center">We currently support text sources up to 10,000 words.</p>
                            </div>
                        </div>
                    )}

                    {step === "discovery" && (
                        <div className="flex flex-col gap-8 animate-in slide-in-from-right-10 duration-500">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <h2 className="text-lg font-semibold tracking-tight">Topic / Subject</h2>
                                    <div className="relative">
                                        <Input
                                            placeholder='e.g., "Photosynthesis", "React Hooks"'
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
                                                className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors bg-secondary/10"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h2 className="text-lg font-semibold tracking-tight">Current Knowledge Level</h2>
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
                                                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{level.desc}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "checkpoint" && (
                        <div className="flex flex-col gap-8 animate-in slide-in-from-right-10 duration-500">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-semibold tracking-tight">Scanning your terrain...</h2>
                                <p className="text-muted-foreground text-sm">Tell us which of these "Key Concepts" you already grasp to prune the course path.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {conceptChecks.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background group hover:border-primary/20 transition-colors">
                                        <span className="text-sm font-medium">{item}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCheckpointResponses(prev => ({ ...prev, [item]: false }))}
                                                className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                                    checkpointResponses[item] === false ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                                )}
                                            >
                                                <XCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => setCheckpointResponses(prev => ({ ...prev, [item]: true }))}
                                                className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                                    checkpointResponses[item] === true ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                                )}
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === "assessment" && (
                        <div className="flex flex-col gap-8 animate-in slide-in-from-right-10 duration-500">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-semibold tracking-tight">Calibrating Diagnostic</h2>
                                <p className="text-muted-foreground text-sm">Verify your understanding to focus the curriculum on your weakest gaps.</p>
                            </div>

                            <div className="flex flex-col gap-8">
                                {diagnosticQuestions.map((q, qIndex) => (
                                    <div key={q.id} className="flex flex-col gap-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Module {qIndex + 1}</span>
                                        <h3 className="text-lg font-medium leading-snug">{q.question}</h3>
                                        <div className="grid gap-2">
                                            {q.options.map((opt: any, oIndex: number) => {
                                                const isSelected = quizResponses[q.id] === oIndex
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setQuizResponses(prev => ({ ...prev, [q.id]: oIndex }))}
                                                        className={cn(
                                                            "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                                                            isSelected ? "border-primary bg-primary/[0.04] ring-1 ring-primary" : "border-border hover:bg-secondary/30"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-5 w-5 rounded-full border flex items-center justify-center",
                                                            isSelected ? "border-primary bg-primary text-white" : "border-border"
                                                        )}>
                                                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-sm">{opt.text}</span>
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
                        <div className="flex flex-col gap-8 animate-in slide-in-from-right-10 duration-500">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-semibold tracking-tight">Our Judgment of your Profile</h2>
                                <p className="text-muted-foreground text-sm">Based on your responses, we've inferred this model of your understanding. Cross-confirm to finalize.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {judgments.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-border bg-background shadow-sm hover:border-primary/20 transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className="h-5 w-5 mt-0.5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                            </div>
                                            <span className="text-sm font-medium leading-relaxed">{item}</span>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => setSummaryResponses(prev => ({ ...prev, [i]: false }))}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1.5",
                                                    summaryResponses[i] === false ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20" : "bg-secondary text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Wrong
                                            </button>
                                            <button
                                                onClick={() => setSummaryResponses(prev => ({ ...prev, [i]: true }))}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1.5",
                                                    summaryResponses[i] === true ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Confirm
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
                        disabled={isLoading}
                        onClick={() => {
                            if (step === "source") setIsOpen(false)
                            else if (step === "discovery") setStep("source")
                            else if (step === "checkpoint") setStep("discovery")
                            else if (step === "assessment") setStep("checkpoint")
                            else if (step === "summary") setStep("assessment")
                        }}
                    >
                        {step === "source" ? "Cancel" : <><ChevronLeft size={16} className="mr-2" /> Back</>}
                    </Button>

                    <Button
                        disabled={(step === "source" && !sourceText) || (step === "discovery" && (!topic || !selectedLevel)) || isLoading}
                        onClick={() => {
                            if (step === "source") setStep("discovery")
                            else if (step === "discovery") handleGenerateDomain()
                            else if (step === "checkpoint") handleGenerateAssessment()
                            else if (step === "assessment") handleFinishAssessment()
                            else if (step === "summary") handleCreateCourse()
                        }}
                        className="px-8 min-w-[140px] relative overflow-hidden group"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                Synchronizing...
                            </span>
                        ) : (
                            <>
                                {step === "summary" ? "Construct Learning Map" : "Continue"}
                                {step !== "summary" && <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function SourceButton({ icon: Icon, label, iconColor = "text-white", onClick, disabled, active }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all group",
                disabled ? "opacity-40 cursor-not-allowed border-border/40" :
                    active ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20 scale-[1.02]" :
                        "cursor-pointer border-border hover:bg-secondary/20 hover:border-border/80"
            )}
        >
            <div className={cn("p-2 rounded-xl transition-colors", disabled ? "text-muted-foreground" : iconColor)}>
                <Icon size={22} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">{label}</span>
        </button>
    )
}
