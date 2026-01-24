import { GalleryVerticalEnd } from "lucide-react"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-2 font-medium opacity-80">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                        <GalleryVerticalEnd size={14} />
                    </div>
                    <span className="tracking-tight text-sm">StudyFlow</span>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <SignupForm />
            </div>
        </div>
    )
}
