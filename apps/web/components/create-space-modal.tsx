
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Globe, Upload, Link2, HardDrive, FileText, X, Sparkles, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Step = "source" | "form"

export function CreateSpaceModal({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
    const [step, setStep] = useState<Step>("source")
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        topic: "",
        level: "beginner",
        time: "15 mins",
        text: ""
    })

    if (!isOpen) return null

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/ai/course/generate", {
                method: "POST",
                body: JSON.stringify({
                    topic: formData.topic,
                    goal: "Understand the core concepts of " + formData.topic,
                    level: formData.level,
                    action: "course-structure"
                })
            })

            if (!res.ok) throw new Error("Failed to generate course")

            const data = await res.json()

            if (data.courseId) {
                window.location.href = `/course/${data.courseId}`
            }

        } catch (e) {
            console.error(e)
            // Ideally show error toast here
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
