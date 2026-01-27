import { cn } from "@/lib/utils";

export function SourceButton({ icon: Icon, label, iconColor = "text-white", onClick, disabled, active }: any) {
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
