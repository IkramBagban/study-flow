"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Globe, Upload, Link2, HardDrive, FileText, X, Sparkles, Check, ChevronRight, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Step = "source" | "form" | "quiz" | "results"

export function CreateSpaceModal({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
    const [step, setStep] = useState<Step>("source")
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        topic: "",
        level: "beginner",
        time: "15 mins",
        text: ""
    })
    const [quizData, setQuizData] = useState<any>(null)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [results, setResults] = useState<any>(null)

    if (!isOpen) return null

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/ai/generate-quiz", {
                method: "POST",
                body: JSON.stringify({
                    topic: formData.topic,
                    knowledgeLevel: formData.level,
                    timeCommitment: formData.time,
                    sourceText: formData.text
                })
            })
            const data = await res.json()
            setQuizData(data)
            setStep("quiz")
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleGrade = async () => {
        setLoading(true)
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, oId]) => ({
                questionId: qId,
                selectedOptionId: oId
            }))

            const res = await fetch("/api/ai/grade-quiz", {
                method: "POST",
                body: JSON.stringify({
                    questions: quizData.questions,
                    userAnswers: formattedAnswers
                })
            })
            const data = await res.json()
            setResults(data)
            setStep("results")
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                    className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 z-10 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="size-5" />
                    </button>

                    <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide">

                        {step === "source" && (
                            <SourceSelectionStep onPasteText={() => setStep("form")} />
                        )}

                        {step === "form" && (
                            <FormStep
                                data={formData}
                                onChange={setFormData}
                                onSubmit={handleGenerate}
                                loading={loading}
                                onBack={() => setStep("source")}
                            />
                        )}

                        {step === "quiz" && quizData && (
                            <QuizStep
                                questions={quizData.questions}
                                answers={answers}
                                setAnswers={setAnswers}
                                onSubmit={handleGrade}
                                loading={loading}
                            />
                        )}

                        {step === "results" && results && (
                            <ResultsStep result={results} onClose={onClose} />
                        )}

                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

function SourceSelectionStep({ onPasteText }: { onPasteText: () => void }) {
    return (
        <div className="flex flex-col gap-10 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
                <h2 className="text-4xl font-semibold tracking-tight text-white">
                    What do you want to <br />
                    <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        learn today?
                    </span>
                </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto w-full">
                <SourceButton icon={Upload} label="Upload files" disabled />
                <SourceButton icon={Link2} label="Websites" iconColor="text-red-400" disabled />
                <SourceButton icon={HardDrive} label="Drive" iconColor="text-blue-400" disabled />
                <SourceButton
                    icon={FileText}
                    label="Paste Text"
                    iconColor="text-emerald-400"
                    onClick={onPasteText}
                />
            </div>
            <p className="text-zinc-500 text-sm">Select a source to begin your knowledge probe.</p>
        </div>
    )
}

function FormStep({ data, onChange, onSubmit, loading, onBack }: any) {
    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500">
            <div className="space-y-2">
                <button onClick={onBack} className="text-sm text-zinc-500 hover:text-white mb-4 flex items-center gap-1">
                    <ChevronRight className="rotate-180 size-4" /> Back
                </button>
                <h3 className="text-2xl font-semibold text-white">Knowledge Probe</h3>
                <p className="text-zinc-400">Tell us a bit about your goal so we can tailor the quiz.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Topic / Goal</label>
                    <Input
                        placeholder="e.g. Learn React Hooks"
                        value={data.topic}
                        onChange={e => onChange({ ...data, topic: e.target.value })}
                        className="bg-zinc-900/50 border-white/10 text-white h-12"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Current Level</label>
                        <select
                            className="w-full h-12 rounded-md bg-zinc-900/50 border border-white/10 text-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
                            value={data.level}
                            onChange={e => onChange({ ...data, level: e.target.value })}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Time Available</label>
                        <Input
                            placeholder="e.g. 30 mins"
                            value={data.time}
                            onChange={e => onChange({ ...data, time: e.target.value })}
                            className="bg-zinc-900/50 border-white/10 text-white h-12"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Source Material (Paste Text)</label>
                    <textarea
                        className="w-full h-40 rounded-md bg-zinc-900/50 border border-white/10 text-white p-4 text-sm focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                        placeholder="Paste the content you want to learn here..."
                        value={data.text}
                        onChange={e => onChange({ ...data, text: e.target.value })}
                    />
                </div>
            </div>

            <Button onClick={onSubmit} disabled={loading || !data.text} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium">
                {loading ? <span className="flex items-center gap-2"><Sparkles className="size-4 animate-spin" /> Generating Probe...</span> : "Generate Quiz"}
            </Button>
        </div>
    )
}

function QuizStep({ questions, answers, setAnswers, onSubmit, loading }: any) {
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500">
            <div className="space-y-2 text-center">
                <h3 className="text-2xl font-semibold text-white">Diagnostic Quiz</h3>
                <p className="text-zinc-400">Answer these to help us calibrate your learning path.</p>
            </div>

            <div className="space-y-6">
                {questions.map((q: any, i: number) => (
                    <div key={q.id} className="p-6 rounded-xl bg-zinc-900/40 border border-white/5 space-y-4">
                        <h4 className="text-lg font-medium text-zinc-100"><span className="text-blue-500 mr-2">{i + 1}.</span>{q.question}</h4>
                        <div className="grid gap-3">
                            {q.options.map((opt: any) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
                                    className={cn(
                                        "text-left p-4 rounded-lg border transition-all text-sm",
                                        answers[q.id] === opt.id
                                            ? "bg-blue-500/10 border-blue-500 text-blue-200"
                                            : "bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                    )}
                                >
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={onSubmit} disabled={loading || Object.keys(answers).length !== questions.length} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-lg mt-8">
                {loading ? "Analyzing Results..." : "Submit & Grade"}
            </Button>
        </div>
    )
}

function ResultsStep({ result, onClose }: any) {
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in scale-95 duration-500">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 mb-4">
                    <span className="text-4xl font-bold text-emerald-400">{result.score}/{result.totalQuestions}</span>
                </div>
                <h3 className="text-3xl font-semibold text-white">Analysis Complete</h3>
                <p className="text-zinc-300 leading-relaxed max-w-lg mx-auto">{result.feedback}</p>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Corrections</h4>
                {result.corrections.map((c: any, i: number) => (
                    <div key={i} className={cn("p-4 rounded-lg border flex gap-4", c.correct ? "bg-emerald-900/10 border-emerald-500/20" : "bg-red-900/10 border-red-500/20")}>
                        <div className={cn("mt-1 size-6 rounded-full flex items-center justify-center shrink-0", c.correct ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500")}>
                            {c.correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                        </div>
                        <div>
                            <p className={cn("font-medium mb-1", c.correct ? "text-emerald-400" : "text-red-400")}>
                                {c.correct ? "Correct" : "Incorrect"}
                            </p>
                            <p className="text-zinc-400 text-sm">{c.explanation}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={onClose} className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-medium">
                Continue to Dashboard
            </Button>
        </div>
    )
}

function SourceButton({ icon: Icon, label, iconColor = "text-white", onClick, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border bg-zinc-900/30 transition-all group",
                disabled ? "opacity-50 cursor-not-allowed border-white/5" : "cursor-pointer border-white/10 hover:bg-zinc-900 hover:border-white/20 hover:scale-[1.02]"
            )}
        >
            <div className={cn("p-3 rounded-full bg-zinc-900 border border-white/5 transition-colors group-hover:bg-zinc-800", iconColor)}>
                <Icon className="size-6" />
            </div>
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{label}</span>
        </button>
    )
}
