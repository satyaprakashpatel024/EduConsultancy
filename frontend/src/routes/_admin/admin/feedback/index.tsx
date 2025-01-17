import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import FeedbackList from "@/components/FeedbackList.tsx";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchFeedbackPage } from "@/service/feedbacks.ts";
import { z } from "zod";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination.tsx";

const feedbackSearchSchema = z.object({
    page: z.number().default(1),
    size: z.number().default(10),
    order: z.enum(['asc', 'desc']).default('asc'),
    sort: z.enum(['name', 'rating', 'createdAt']).default('name'),
});

export const Route = createFileRoute('/_admin/admin/feedback/')({
    validateSearch: (search) => feedbackSearchSchema.parse(search),
    errorComponent: ({ error }) => <div>Error: {error.message}</div>,
    notFoundComponent: () => <div>No feedback found</div>,
    component: RouteComponent,
});

function RouteComponent() {
    const [currentPage, setCurrentPage] = useState(1);
    const { page, size, sort, order } = Route.useSearch();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["feedbacks", page, size, sort, order],
        queryFn: () => fetchFeedbackPage(page, size, order, sort),
        placeholderData: keepPreviousData,
    });

    // Sync state with the URL on mount
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const pageFromUrl = parseInt(queryParams.get('page') || '1', 10);
        setCurrentPage(pageFromUrl);
    }, []);

    const paginate = (page: number) => {
        setCurrentPage(page);
        // Update URL with the new page number
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set('page', String(page));
        window.history.pushState(null, '', `?${queryParams.toString()}`);
    };

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading feedbacks.</div>;

    if (!data) {
        return <div>No data available</div>;
    }

    const { list, totalPages } = data;

    return (
        <div className="p-6">
            <FeedbackList feedbacks={list} />

            <Pagination className={"mt-10"}>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <PaginationItem key={number}>
                            <PaginationLink
                                onClick={() => paginate(number)}
                                isActive={currentPage === number}
                            >
                                {number}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
