import { Skeleton } from "@/components/ui/skeleton";

export const NoteListSkeleton = () => {
    return (
        <div className="space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2 p-4 border rounded-lg">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-12 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
};
