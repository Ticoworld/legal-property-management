"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, Building2, UserCircle, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { globalSearch, type SearchResult } from "@/server/actions/search";

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult>({
    clients: [],
    properties: [],
    tenants: [],
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ clients: [], properties: [], tenants: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await globalSearch(query);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (type: "client" | "property" | "tenant", id: string) => {
    setOpen(false);
    setQuery("");
    setResults({ clients: [], properties: [], tenants: [] });

    switch (type) {
      case "client":
        router.push(`/clients/${id}`);
        break;
      case "property":
        router.push(`/properties/${id}`);
        break;
      case "tenant":
        router.push(`/tenancies/${id}`);
        break;
    }
  };

  const hasResults =
    results.clients.length > 0 ||
    results.properties.length > 0 ||
    results.tenants.length > 0;

  return (
    <>
      {/* Search trigger button in header */}
      <Button
        variant="outline"
        size="sm"
        className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Global Search"
        description="Search for clients, properties, or tenants"
      >
        <CommandInput
          placeholder="Search clients, properties, tenants..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {!isLoading && query.length >= 2 && !hasResults && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          )}

          {/* Clients */}
          {results.clients.length > 0 && (
            <CommandGroup heading="Clients">
              {results.clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`client-${client.id}-${client.name}`}
                  onSelect={() => handleSelect("client", client.id)}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Properties */}
          {results.properties.length > 0 && (
            <CommandGroup heading="Properties">
              {results.properties.map((property) => (
                <CommandItem
                  key={property.id}
                  value={`property-${property.id}-${property.address}`}
                  onSelect={() => handleSelect("property", property.id)}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{property.address}</span>
                    <span className="text-xs text-muted-foreground">
                      {property.city}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Tenants */}
          {results.tenants.length > 0 && (
            <CommandGroup heading="Tenants">
              {results.tenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  value={`tenant-${tenant.id}-${tenant.tenantName}`}
                  onSelect={() => handleSelect("tenant", tenant.tenancyId)}
                  className="cursor-pointer"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{tenant.tenantName}</span>
                    <span className="text-xs text-muted-foreground">
                      {tenant.propertyAddress}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
