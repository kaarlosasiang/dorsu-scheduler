"use client";

import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableSearchProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  placeholder?: string;
}

export function DataTableSearch<TData>({
  table,
  placeholder = "Search all columns...",
  className,
  ...props
}: DataTableSearchProps<TData>) {
  const [searchValue, setSearchValue] = React.useState("");

  // Update global filter when search value changes
  React.useEffect(() => {
    table.setGlobalFilter(searchValue);
  }, [searchValue, table]);

  // Get current global filter value
  React.useEffect(() => {
    const globalFilter = table.getState().globalFilter ?? "";
    setSearchValue(globalFilter);
  }, [table]);

  return (
    <div
      className={cn("relative flex items-center", className)}
      {...props}
    >
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-8 pr-8"
      />
      {searchValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 h-6 w-6 p-0 hover:bg-transparent"
          onClick={() => setSearchValue("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}