import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryVerticalEnd } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center gap-12">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <GalleryVerticalEnd size={24} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">StudyFlow</h1>
        <p className="max-w-[600px] text-muted-foreground text-lg sm:text-xl">
          Reducing cognitive noise so your brain can focus on building deep understanding.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none justify-center">
        <Button asChild size="lg" className="px-8 py-6 h-auto text-lg">
          <Link href="/signup">Start Learning</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="px-8 py-6 h-auto text-lg">
          <Link href="/login">Welcome Back</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mt-12 text-left border-t border-border pt-12">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Cognitive Focus</h3>
          <p className="text-sm text-muted-foreground">Every element is designed to minimize distractions and maximize retention.</p>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Deep Understanding</h3>
          <p className="text-sm text-muted-foreground">Build mental models that stick through scientifically-backed learning methods.</p>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Structure for Thinking</h3>
          <p className="text-sm text-muted-foreground">A predictable layout that feels like an extension of your thought process.</p>
        </div>
      </div>
    </div>
  );
}