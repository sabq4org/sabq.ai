import React from 'react';
import { cn } from '../../lib/utils';

interface TableProps {
  className?: string;
  children?: React.ReactNode;
}

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          "border border-gray-200 dark:border-gray-800",
          className
        )}
        {...props}
      />
    </div>
  )
)

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        "bg-gray-50 dark:bg-gray-800/50",
        "[&_tr]:border-b [&_tr]:border-gray-200 dark:[&_tr]:border-gray-800",
        className
      )}
      {...props}
    />
  )
)

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn(
        "[&_tr:last-child]:border-0",
        "[&_tr]:border-b [&_tr]:border-gray-200 dark:[&_tr]:border-gray-800",
        className
      )}
      {...props}
    />
  )
)

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        "bg-gray-50 dark:bg-gray-800/50",
        "font-medium text-gray-900 dark:text-gray-100",
        "[&_tr]:border-t [&_tr]:border-gray-200 dark:[&_tr]:border-gray-800",
        className
      )}
      {...props}
    />
  )
)

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50",
        "data-[state=selected]:bg-gray-100 dark:data-[state=selected]:bg-gray-800",
        className
      )}
      {...props}
    />
  )
)

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-right align-middle font-medium",
        "text-gray-500 dark:text-gray-400",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle",
        "text-gray-900 dark:text-gray-100",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn(
        "mt-4 text-sm text-gray-500 dark:text-gray-400",
        className
      )}
      {...props}
    />
  )
)

Table.displayName = "Table"
TableHeader.displayName = "TableHeader"
TableBody.displayName = "TableBody"
TableFooter.displayName = "TableFooter"
TableRow.displayName = "TableRow"
TableHead.displayName = "TableHead"
TableCell.displayName = "TableCell"
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}; 