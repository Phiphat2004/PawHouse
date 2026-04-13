import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-center gap-2">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                    >
                        1
                    </button>
                    {startPage > 2 && <span className="px-2">...</span>}
                </>
            )}

            {pages.map((pageNum) => (
                <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${pageNum === page
                            ? 'bg-[#846551] text-white border-[#846551]'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                >
                    {pageNum}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="px-2">...</span>}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Pagination;
