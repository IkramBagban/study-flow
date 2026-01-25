"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { CreateSpaceModal } from "@/components/create-space-modal"

export function CreateCourseCard() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <div
                onClick={() => setIsOpen(true)}
                className="group border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-primary/50 transition-colors cursor-pointer"
            >
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Plus size={20} />
                </div>
                <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">Create a new course</h3>
                    <p className="text-xs text-muted-foreground">Start build deep understanding today.</p>
                </div>
            </div>

            <CreateSpaceModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
