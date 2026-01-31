"use client";

interface TimelineEvent {
    date: string;
    event: string;
    impact?: string;
}

export function TimelineVisualizer({ data }: { data: string | TimelineEvent[] }) {
    let events: TimelineEvent[] = [];
    try {
        events = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
        return <div className="text-destructive p-4 border border-destructive/20 rounded-lg">Invalid timeline data</div>;
    }

    if (!Array.isArray(events)) return null;

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {events.map((item, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors group-hover:border-primary/50">
                            <div className="size-2 rounded-full bg-primary" />
                        </div>
                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <time className="font-bold text-primary text-xs uppercase tracking-wider">{item.date}</time>
                            </div>
                            <h4 className="font-bold text-foreground mb-1">{item.event}</h4>
                            {item.impact && <p className="text-sm text-muted-foreground leading-relaxed">{item.impact}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
