"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export type AutocompleteOption = {
  id: string;
  label: string;
  description?: string;
};

type AutocompleteProps = {
  value: string;
  options: AutocompleteOption[];
  onSelect: (option: AutocompleteOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  maxItems?: number;
  showIdFallback?: boolean;
};

export default function Autocomplete({
  value,
  options,
  onSelect,
  placeholder = "Selectionner",
  searchPlaceholder = "Rechercher...",
  emptyText = "Aucun resultat.",
  isLoading = false,
  disabled = false,
  maxItems = 8,
  showIdFallback = true,
}: AutocompleteProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options.slice(0, maxItems);

    return options
      .filter(
        (option) =>
          option.label.toLowerCase().includes(query) ||
          option.id.toLowerCase().includes(query) ||
          option.description?.toLowerCase().includes(query)
      )
      .slice(0, maxItems);
  }, [options, search, maxItems]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        className="flex h-11 w-full items-center justify-between border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 focus:outline-none focus:border-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selectedOption ? "truncate text-slate-900" : "truncate text-slate-400"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-500" />
      </button>

      {isOpen ? (
        <div className="absolute z-20 mt-2 w-full border border-slate-200 bg-white p-2 ">
          <div className="mb-2 flex items-center gap-2 border border-slate-200 px-3">
            <Search className="size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Chargement...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedOption?.id === option.id;
                const metaText = option.description ?? (showIdFallback ? option.id : undefined);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onSelect(option);
                      setSearch("");
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{option.label}</p>
                      {metaText ? <p className="truncate text-xs text-slate-500">{metaText}</p> : null}
                    </div>
                    {isSelected ? <Check className="size-4 shrink-0 text-blue-600" /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 text-sm text-slate-500">{emptyText}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
