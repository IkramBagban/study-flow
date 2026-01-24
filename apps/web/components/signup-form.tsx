"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signUp } from "@/lib/auth-client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function SignupForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        await signUp.email({
            email,
            password,
            name,
            callbackURL: "/dashboard"
        }, {
            onSuccess: () => {
                router.push("/dashboard")
            },
            onError: (ctx) => {
                setError(ctx.error.message)
                setLoading(false)
            }
        });
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-muted-foreground text-sm">
                    Join StudyFlow to build deep understanding through cognitive science.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                    <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm font-medium border border-destructive/20">
                        {error}
                    </div>
                )}
                <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="bg-background border-border focus:ring-primary h-10"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        className="bg-background border-border focus:ring-primary h-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        className="bg-background border-border focus:ring-primary h-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
                    {loading ? "Creating account..." : "Generate Account"}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline underline-offset-4 font-medium transition-colors">
                    Log in
                </Link>
            </p>
        </div>
    )
}
