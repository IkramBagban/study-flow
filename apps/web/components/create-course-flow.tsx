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
import { SourceButton } from "./source-button"

type Step =
    | "discovery"  // 1. Topic & Level (Ask first)
    | "source"     // 2. Resource selection (Ask second)
    | "checkpoint" // 3. Concept extraction check
    | "assessment" // 4. Diagnostic Quiz
    | "summary"    // 5. Knowledge Profile Judgment

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
    const [step, setStep] = React.useState<Step>("discovery")
    const [isLoading, setIsLoading] = React.useState(false)
    const [showQuizResults, setShowQuizResults] = React.useState(false)

    // Form Data
    const [topic, setTopic] = React.useState("")
    const [selectedLevel, setSelectedLevel] = React.useState("new")
    const [sourceText, setSourceText] = React.useState("")
    const [useOnlyResources, setUseOnlyResources] = React.useState(false)

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
                    useOnlyResources,
                    action: "domain-map"
                })
            })
            const data = await res.json()
            const concepts = data.domainMap?.keyConcepts || data.keyConcepts
            if (concepts) {
                setConceptChecks(concepts)
                // BEGINNER SKIP LOGIC
                if (selectedLevel === "new") {
                    handleFinishAssessment([]) // Skip assessment for beginners
                } else {
                    setStep("checkpoint")
                }
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

    const handleFinishAssessment = async (quizResponsesOverride?: any[]) => {
        setIsLoading(true)
        try {
            const results = quizResponsesOverride || diagnosticQuestions.map(q => {
                const selectedIdx = quizResponses[q.id]
                const isCorrect = typeof selectedIdx === 'number' && q.options[selectedIdx]?.id === q.correctOptionId
                return {
                    questionId: q.id,
                    correct: isCorrect
                }
            });

            const selectedConcepts = Object.entries(checkpointResponses)
                .filter(([_, k]) => k)
                .map(([c]) => c);

            const res = await fetch("/api/ai/course/generate", {
                method: "POST",
                body: JSON.stringify({
                    topic,
                    level: selectedLevel,
                    goal: "Generate profile",
                    action: "infer",
                    selectedConcepts,
                    quizResults: results
                })
            })
            const data = await res.json()
            if (data.judgments) {
                setJudgments(data.judgments)
                setStep("summary")
            }
        } catch (e) {
            console.error(e)
            // Fallback
            setJudgments([`We've analyzed your performance in ${topic} and are tailoring the course.`]);
            setStep("summary");
        } finally {
            setIsLoading(false)
        }
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
                                width: step === "discovery" ? "20%" :
                                    step === "source" ? "40%" :
                                        step === "checkpoint" ? "60%" :
                                            step === "assessment" ? "80%" : "100%"
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
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="useOnlyResources"
                                        checked={useOnlyResources}
                                        onChange={(e) => setUseOnlyResources(e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="useOnlyResources" className="text-xs text-muted-foreground select-none cursor-pointer">
                                        Use <strong>only</strong> provided resources (Strict Mode)
                                    </label>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center mt-1">We currently support text sources up to 10,000 words.</p>
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
                                <h2 className="text-2xl font-semibold tracking-tight">Calibrating your path...</h2>
                                <p className="text-muted-foreground text-sm">Tell us which of these "Key Concepts" you already grasp to calibrate the course complexity.</p>
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
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Module {qIndex + 1}</span>
                                            {showQuizResults && (
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                                                    (() => {
                                                        const idx = quizResponses[q.id];
                                                        return typeof idx === 'number' && q.options[idx]?.id === q.correctOptionId;
                                                    })()
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-destructive/10 text-destructive"
                                                )}>
                                                    {(() => {
                                                        const idx = quizResponses[q.id];
                                                        return typeof idx === 'number' && q.options[idx]?.id === q.correctOptionId;
                                                    })() ? "Correct" : "Incorrect"}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-medium leading-snug">{q.question}</h3>
                                        <div className="grid gap-2">
                                            {q.options.map((opt: any, oIndex: number) => {
                                                const isSelected = quizResponses[q.id] === oIndex
                                                const isCorrect = opt.id === q.correctOptionId
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        disabled={showQuizResults}
                                                        onClick={() => setQuizResponses(prev => ({ ...prev, [q.id]: oIndex }))}
                                                        className={cn(
                                                            "flex items-center gap-3 p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                                                            isSelected ? "border-primary bg-primary/[0.04] ring-1 ring-primary" : "border-border hover:bg-secondary/30",
                                                            showQuizResults && isCorrect && "border-emerald-500 bg-emerald-500/5 ring-emerald-500",
                                                            showQuizResults && isSelected && !isCorrect && "border-destructive bg-destructive/5 ring-destructive"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-5 w-5 rounded-full border flex items-center justify-center relative z-10",
                                                            isSelected ? "border-primary bg-primary text-white" : "border-border",
                                                            showQuizResults && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                                                            showQuizResults && isSelected && !isCorrect && "border-destructive bg-destructive text-white"
                                                        )}>
                                                            {(showQuizResults && isCorrect) ? <Check size={12} /> : (isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />)}
                                                        </div>
                                                        <span className="text-sm z-10">{opt.text}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {showQuizResults && q.explanation && (
                                            <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 text-xs text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1">
                                                <strong className="text-foreground block mb-1">Context:</strong>
                                                {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {showQuizResults && (
                                    <div className="mt-4 p-6 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Diagnostic Complete</p>
                                            <h4 className="text-xl font-bold">
                                                {diagnosticQuestions.filter(q => {
                                                    const idx = quizResponses[q.id];
                                                    return idx !== undefined && q.options[idx]?.id === q.correctOptionId;
                                                }).length} / {diagnosticQuestions.length} Correct
                                            </h4>
                                        </div>
                                        <Button onClick={() => handleFinishAssessment()} className="gap-2">
                                            See profile summary <ArrowRight size={16} />
                                        </Button>
                                    </div>
                                )}
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
                            if (step === "discovery") setIsOpen(false)
                            else if (step === "source") setStep("discovery")
                            else if (step === "checkpoint") setStep("source")
                            else if (step === "assessment") {
                                if (showQuizResults) setShowQuizResults(false)
                                else setStep("checkpoint")
                            }
                            else if (step === "summary") setStep("assessment")
                        }}
                    >
                        {step === "discovery" ? "Cancel" : <><ChevronLeft size={16} className="mr-2" /> Back</>}
                    </Button>

                    <Button
                        disabled={(step === "discovery" && (!topic || !selectedLevel)) || (step === "source" && !sourceText) || isLoading}
                        onClick={() => {
                            if (step === "discovery") setStep("source")
                            else if (step === "source") handleGenerateDomain()
                            else if (step === "checkpoint") handleGenerateAssessment()
                            else if (step === "assessment") {
                                if (showQuizResults) handleFinishAssessment()
                                else setShowQuizResults(true)
                            }
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
