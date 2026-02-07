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
    BrainCircuit
} from "lucide-react"
import { SourceButton } from "./source-button"
import { toast } from "sonner"
import { Progress } from "./ui/progress"

type Step =
    | "discovery"  // 1. Topic & Level 
    | "source"     // 2. Resource selection 
    | "analyzing"  // 3. (NEW) Async Analysis (Waiting for Worker)
    | "preview"    // 4. (NEW) Confirm Structure
    | "checkpoint" // 5. Concept extraction check
    | "assessment" // 6. Diagnostic Quiz
    | "summary"    // 7. Knowledge Profile Judgment

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

interface UploadedResource {
    id: string;
    name: string;
    size: number;
    status: "QUEUED" | "PROCESSING" | "READY" | "ERROR";
    previewStructure?: any;
    pageCount?: number;
    previewDomainMap?: any;
}

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
    const [previewOutline, setPreviewOutline] = React.useState<any>(null); // Course Structure
    const [previewDomainMap, setPreviewDomainMap] = React.useState<any>(null); // Domain Map for PDF

    // User Responses
    const [checkpointResponses, setCheckpointResponses] = React.useState<Record<string, boolean>>({})
    const [quizResponses, setQuizResponses] = React.useState<Record<string, number>>({})
    const [summaryResponses, setSummaryResponses] = React.useState<Record<number, boolean>>({})

    // Upload & Analysis State
    const [uploadedResources, setUploadedResources] = React.useState<UploadedResource[]>([]);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);

    // File Input Ref
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    // Polling for Analysis
    React.useEffect(() => {
        if (step !== "analyzing") return;

        // Start polling logic is handled in handleFileUpload or restored on mount if needed
        // Here we just ensure if we are on analyzing step and have resources, we poll
        if (uploadedResources.length > 0) {
            // If we have a resource ID, we can poll
            // But we need the course ID too. 
            // We'll rely on the pollForAnalysis function triggered by upload for now.
            // If page reloaded, we might lose the interval.
            // Ideally we persist the courseId/resourceId to restore polling.
        }
    }, [step]);


    // Load/Save LocalStorage
    React.useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setStep(data.step || "discovery"); // Default to discovery
                setTopic(data.topic || "");
                setSelectedLevel(data.selectedLevel || "new");
                setSourceText(data.sourceText || "");
                // ... restore other fields if needed
            } catch (e) {
                console.error("Failed to load saved state", e);
            }
        }
    }, []);

    // Save state on change
    React.useEffect(() => {
        if (!isOpen) return;
        const state = {
            step, topic, selectedLevel, sourceText
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [step, topic, selectedLevel, sourceText, isOpen]);

    const reset = () => {
        setIsOpen(false)
        setStep("discovery")
        setTopic("")
        setSelectedLevel("new")
        setSourceText("")
        setUploadedResources([])
        setPreviewOutline(null)
        setCheckpointResponses({})
        setQuizResponses({})
        setConceptChecks([])
        setDiagnosticQuestions([])
        setJudgments([])
        setSummaryResponses({})
        setIsLoading(false)
        localStorage.removeItem(STORAGE_KEY);
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // --- NEW: Async Upload + Analyze ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setIsLoading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Create Draft Course
            // We create a temporary course ID to attach resources to.
            // This endpoint should create a course with status 'DRAFT'
            const courseRes = await fetch("/api/course/create-draft", { method: "POST" });

            // Fallback for demo if endpoint doesn't exist yet: use existing generation endpoint or mock
            // Assuming endpoint exists based on previous conversations or we create it.
            // If it fails, we catch error.

            let courseId;
            if (courseRes.ok) {
                const courseData = await courseRes.json();
                courseId = courseData.courseId;
            } else {
                // Fallback or Error
                throw new Error("Could not create draft course session");
            }

            // Upload to that course
            const uploadRes = await fetch(`/api/course/${courseId}/resources/upload`, {
                method: "POST",
                body: formData
            });

            if (uploadRes.ok) {
                const data = await uploadRes.json();
                setUploadedResources(prev => [...prev, {
                    id: data.resourceId,
                    name: data.fileName,
                    size: file.size,
                    status: "QUEUED"
                }]);

                // Move to Analyzing Step
                setStep("analyzing");
                // Start Polling
                pollForAnalysis(courseId, data.resourceId);
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload. Please try again.");
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const pollForAnalysis = async (courseId: string, resourceId: string) => {
        const interval = setInterval(async () => {
            try {
                // Poll status
                const res = await fetch(`/api/course/${courseId}/resources/${resourceId}/status`);
                let statusData;

                if (res.ok) {
                    statusData = await res.json();
                } else {
                    // Fallback poll list
                    const listRes = await fetch(`/api/course/${courseId}/resources`);
                    if (listRes.ok) {
                        const list = await listRes.json();
                        statusData = list.find((r: any) => r.id === resourceId);
                    }
                }

                if (statusData) {
                    // Update local state
                    setUploadedResources(prev => prev.map(r => r.id === resourceId ? { ...r, status: statusData.status } : r));

                    // CHECK FOR PREVIEW
                    // CHECK FOR PREVIEW
                    if (statusData.metadata?.previewStructure) {
                        clearInterval(interval);
                        setPreviewOutline(statusData.metadata.previewStructure.modules);

                        // Set Topic if available
                        if (!topic && statusData.metadata.previewDomainMap?.subject) {
                            setTopic(statusData.metadata.previewDomainMap.subject);
                        }

                        // NEW: Capture Domain Map fully
                        if (statusData.metadata.previewDomainMap) {
                            setPreviewDomainMap(statusData.metadata.previewDomainMap);
                            // Set Concept Checks
                            if (statusData.metadata.previewDomainMap.keyConcepts) {
                                setConceptChecks(statusData.metadata.previewDomainMap.keyConcepts);
                                setStep("checkpoint"); // Go to Concept Check first
                                return;
                            }
                        }

                        setStep("preview");
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }, 2000);
    };

    const removeFile = (index: number) => {
        setUploadedResources(prev => prev.filter((_, i) => i !== index));
    };

    // --- Legacy/Text Handlers ---

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
                    handleFinishAssessment([]) // Skip assessment
                } else {
                    setStep("checkpoint")
                }
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to generate concepts. Try again.")
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
            toast.error("Failed to generate assessment.")
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

            // If we have uploaded resources, we pass them.
            // If we are in 'preview' flow, we might want to use the draft course ID directly?
            // For now, let's stick to generating a new structure based on assessment or preview.

            const res = await fetch("/api/ai/course/generate", {
                method: "POST",
                body: JSON.stringify({
                    topic,
                    goal: "Personalized deep learning based on assessment",
                    level: selectedLevel,
                    sourceText,
                    action: "course-structure",
                    files: uploadedResources.map(r => ({ id: r.id, name: r.name, size: r.size })), // Pass metadata with IDs
                    domainMap: previewDomainMap,
                    structure: previewOutline ? { modules: previewOutline } : undefined,
                    assessmentData: {
                        quizResults,
                        knownConcepts
                    },
                    courseId: undefined // We would pass draft ID if we want to promote it
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
                                        step === "analyzing" ? "50%" :
                                            step === "preview" ? "60%" :
                                                step === "checkpoint" ? "70%" :
                                                    step === "assessment" ? "80%" : "100%"
                            }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto scrollbar-hide flex-1 relative">

                    {/* STEP: SOURCE (Upload / Paste) */}
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
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.txt,.md"
                                    onChange={handleFileUpload}
                                />
                                <SourceButton
                                    icon={Upload}
                                    label="Upload files"
                                    onClick={() => fileInputRef.current?.click()}
                                />
                                <SourceButton icon={Link2} label="Websites" iconColor="text-red-400" disabled />
                                <SourceButton icon={HardDrive} label="Drive" iconColor="text-blue-400" disabled />
                                <SourceButton
                                    icon={FileText}
                                    label="Paste Text"
                                    iconColor="text-emerald-400"
                                    active={true}
                                />
                            </div>

                            {/* Uploaded Files Status */}
                            {uploadedResources.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full text-left">
                                    {uploadedResources.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="size-4 shrink-0" />
                                                <span className="text-xs font-medium truncate">{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col items-end text-[10px] opacity-70">
                                                    <span>{formatSize(file.size)}</span>
                                                    {file.status === "QUEUED" && <span className="animate-pulse">Queued...</span>}
                                                    {file.status === "PROCESSING" && <span className="animate-pulse">Analyzing...</span>}
                                                    {file.status === "READY" && <span>Ready</span>}
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="hover:text-destructive transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

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

                    {/* STEP: ANALYZING (Async) */}
                    {step === "analyzing" && (
                        <div className="flex flex-col items-center justify-center py-12 gap-6 animate-in fade-in zoom-in-95">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <BrainCircuit className="size-16 text-primary relative z-10 animate-bounce" />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Analyzing your material...</h2>
                                <p className="text-muted-foreground text-sm max-w-sm">We're reading your document, extracting key concepts, and designing a custom curriculum.</p>
                            </div>
                            <Progress value={33} className="w-[60%] h-2" />
                            <p className="text-xs text-muted-foreground animate-pulse">Scanning contents...</p>
                        </div>
                    )}

                    {/* STEP: PREVIEW (Confirm Structure) */}
                    {step === "preview" && previewOutline && (
                        <div className="flex flex-col gap-6 animate-in slide-in-from-right-10 overflow-hidden h-full">
                            <div className="text-center shrink-0">
                                <h2 className="text-2xl font-bold">Here is what we found</h2>
                                <p className="text-muted-foreground">We detected this structure from your upload. Is this what you want to learn?</p>
                            </div>

                            <div className="bg-secondary/10 border border-border rounded-xl p-4 overflow-y-auto space-y-4 flex-1 max-h-[400px]">
                                {previewOutline.map((mod: any, i: number) => (
                                    <div key={i} className="bg-card p-4 rounded-lg border border-border/50">
                                        <h4 className="font-semibold text-primary mb-2">Module {i + 1}: {mod.title}</h4>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                            {mod.chapters.map((chap: any, j: number) => (
                                                <li key={j}>{chap.title}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-center gap-4 shrink-0 pt-4">
                                <Button variant="outline" onClick={() => setStep("discovery")}>No, let me customize</Button>
                                <Button onClick={() => {
                                    setJudgments(["Based on the textbook, this seems to be an Intermediate course."]);
                                    setStep("summary");
                                }}>
                                    Looks perfect! <ArrowRight className="ml-2 size-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP: DISCOVERY (Topic/Level) */}
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

                    {/* STEP: CHECKPOINT (Concept Check) */}
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

                    {/* STEP: ASSESSMENT (Diagnostic) */}
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

                    {/* STEP: SUMMARY (Judgments) */}
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
                            else if (step === "analyzing") setStep("source")
                            else if (step === "preview") setStep("analyzing") // Or back to source?
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
                        disabled={(step === "discovery" && (!topic || !selectedLevel)) || (step === "source" && !sourceText && uploadedResources.length === 0) || isLoading}
                        onClick={() => {
                            if (step === "discovery") setStep("source")
                            else if (step === "source") handleGenerateDomain()
                            else if (step === "preview") {
                                setJudgments(["Based on the course preview, we've prepared this curriculum."]);
                                setStep("summary");
                            }
                            else if (step === "checkpoint") {
                                if (previewOutline) setStep("preview");
                                else handleGenerateAssessment();
                            }
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
