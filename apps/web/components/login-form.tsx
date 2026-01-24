"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signIn } from "@/lib/auth-client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        await signIn.email({
            email,
            password,
            callbackURL: "/dashboard"
        }, {
            onSuccess: () => {
                // Redirect handled by callbackURL
                console.log("Login successful")
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
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground text-sm">
                    Enter your details to continue your learning journey.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                    <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm font-medium border border-destructive/20">
                        {error}
                    </div>
                )}
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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                        >
                            Forgot password?
                        </Link>
                    </div>
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
                    {loading ? "Signing in..." : "Continue"}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full h-10" type="button">
                    Google
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline underline-offset-4 font-medium transition-colors">
                    Sign up
                </Link>
            </p>
        </div>
    )
}
