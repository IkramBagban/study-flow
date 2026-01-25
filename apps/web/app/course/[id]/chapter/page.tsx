

export default async function ChapterPage(props: { params: Promise<{ id: string }> }) {
    return (

        <div className="pt-12 border-t border-border mt-12 flex justify-end">
            <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                Complete Chapter
            </button>
        </div>
    );
}
