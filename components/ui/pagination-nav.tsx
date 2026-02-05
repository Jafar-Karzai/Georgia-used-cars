'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Pagination Navigation Component
 * A reusable pagination component with page numbers
 */

interface PaginationNavProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationNav({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationNavProps) {
  if (totalPages <= 1) return null

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i)
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()
  const showEndEllipsis = totalPages > 5 && currentPage < totalPages - 2

  return (
    <div className={`flex justify-center items-center gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl border border-border text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:border-precision-900 hover:text-precision-900 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </button>

      {pageNumbers.map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
            currentPage === pageNum
              ? 'bg-precision-900 text-white'
              : 'border border-border hover:border-precision-900 hover:text-precision-900'
          }`}
          aria-label={`Page ${pageNum}`}
          aria-current={currentPage === pageNum ? 'page' : undefined}
        >
          {pageNum}
        </button>
      ))}

      {showEndEllipsis && (
        <>
          <span className="text-muted-foreground">...</span>
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-10 h-10 rounded-xl border border-border font-bold text-sm hover:border-precision-900 hover:text-precision-900 transition-all"
            aria-label={`Page ${totalPages}`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-xl border border-border text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:border-precision-900 hover:text-precision-900 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
