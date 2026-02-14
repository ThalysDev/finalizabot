"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  Bell,
  LayoutDashboard,
  Search,
  SearchX,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { LastSyncBadge } from "@/components/layout/LastSyncBadge";
import { NAV_COPY, STATE_COPY } from "@/lib/copy/navigation";

const navLinks = [
  { href: "/dashboard", label: NAV_COPY.dashboard, icon: LayoutDashboard },
  { href: "/dashboard/table", label: "Tabela Avançada", icon: BarChart3 },
  { href: "/live", label: "Ao Vivo", icon: Activity, comingSoon: true },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/pricing", label: "Planos", icon: Zap },
];

interface SearchResult {
  id: string;
  name: string;
  position: string;
}

function HeaderSearchEmptyState({ className }: { className: string }) {
  return (
    <div className={className}>
      <div className="mx-auto size-8 rounded-full bg-fb-surface flex items-center justify-center mb-2">
        <SearchX className="size-4 text-fb-text-muted" />
      </div>
      <p className="text-xs text-fb-text-muted text-center">
        {STATE_COPY.noPlayerFound}
      </p>
    </div>
  );
}

export function DarkHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const initialSearchParam = searchParams.get("playerSearch") ?? "";

  const syncSearchParam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim().length >= 2) {
        params.set("playerSearch", value.trim());
      } else {
        params.delete("playerSearch");
      }

      const nextQuery = params.toString();
      if (nextQuery === searchParams.toString()) return;
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      setActiveResultIndex(-1);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const results = (data.results ?? []) as SearchResult[];
      setSearchResults(results);
      setSearchOpen(results.length > 0);
      setActiveResultIndex(results.length > 0 ? 0 : -1);
    } catch {
      setSearchResults([]);
      setSearchOpen(false);
      setActiveResultIndex(-1);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    setSearchQuery(initialSearchParam);
    if (initialSearchParam.length >= 2) {
      void doSearch(initialSearchParam);
    } else {
      setSearchResults([]);
      setSearchOpen(false);
      setActiveResultIndex(-1);
    }
  }, [doSearch, initialSearchParam]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    syncSearchParam(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  function selectSearchResult(index: number) {
    const selected = searchResults[index];
    if (!selected) return;
    router.push(`/player/${selected.id}`);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setActiveResultIndex(-1);
    setMobileOpen(false);
    syncSearchParam("");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveResultIndex(-1);
      return;
    }

    if (!searchOpen || searchResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, searchResults.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((prev) => (prev <= 0 ? 0 : Math.max(prev - 1, 0)));
      return;
    }

    if (event.key === "Enter") {
      if (activeResultIndex >= 0 && activeResultIndex < searchResults.length) {
        event.preventDefault();
        selectSearchResult(activeResultIndex);
      }
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleResultClick() {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setActiveResultIndex(-1);
    setMobileOpen(false);
    syncSearchParam("");
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-fb-border bg-fb-bg/95 backdrop-blur-md px-4 md:px-6 py-3">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6 md:gap-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-fb-text"
        >
          <Image
            src="/logo.png"
            alt="FinalizaBOT"
            width={36}
            height={36}
            className="size-9 object-contain"
            priority
          />
          <h2 className="text-fb-text text-lg font-bold leading-tight tracking-tight">
            FinalizaBOT
          </h2>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-fb-primary bg-fb-primary/8"
                    : "text-fb-text-secondary hover:text-fb-text hover:bg-fb-surface/60"
                }`}
              >
                {link.label}
                {"comingSoon" in link && link.comingSoon && (
                  <span
                    className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-fb-accent-gold"
                    title="Em breve"
                  />
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-fb-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Search + Auth */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex">
          <LastSyncBadge />
        </div>
        {/* Search */}
        <div ref={searchRef} className="hidden md:block relative">
          <div className="flex items-center gap-2 bg-fb-surface rounded-xl px-3 py-2 min-w-[200px] border border-fb-border/50 transition-all duration-200 focus-within:border-fb-primary/30 focus-within:ring-1 focus-within:ring-fb-primary/20 focus-within:shadow-lg focus-within:shadow-fb-primary/5">
            <Search className="size-4 text-fb-text-muted" />
            <input
              type="text"
              name="player-search"
              autoComplete="off"
              placeholder="Buscar jogador..."
              aria-label="Buscar jogador"
              aria-controls="header-search-results"
              aria-expanded={searchOpen}
              aria-autocomplete="list"
              aria-activedescendant={
                activeResultIndex >= 0
                  ? `header-search-option-${activeResultIndex}`
                  : undefined
              }
              role="combobox"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              className="bg-transparent text-sm text-fb-text placeholder:text-fb-text-muted outline-none w-full"
            />
            {searching && (
              <div className="size-4 border-2 border-fb-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {/* Search results dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div
              id="header-search-results"
              role="listbox"
              className="absolute top-full mt-1 left-0 right-0 bg-fb-bg border border-fb-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {searchResults.map((r, index) => (
                <Link
                  key={r.id}
                  id={`header-search-option-${index}`}
                  role="option"
                  aria-selected={activeResultIndex === index}
                  href={`/player/${r.id}`}
                  onClick={handleResultClick}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    activeResultIndex === index
                      ? "bg-fb-surface"
                      : "hover:bg-fb-surface"
                  }`}
                  onMouseEnter={() => setActiveResultIndex(index)}
                >
                  <div className="size-8 rounded-full bg-fb-primary/10 flex items-center justify-center text-fb-primary text-sm font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fb-text">{r.name}</p>
                    <p className="text-xs text-fb-text-muted">{r.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {searchOpen &&
            searchQuery.length >= 2 &&
            searchResults.length === 0 &&
            !searching && (
              <HeaderSearchEmptyState className="absolute top-full mt-1 left-0 right-0 bg-fb-bg border border-fb-border rounded-xl shadow-xl z-50 p-4" />
            )}
        </div>

        {/* Auth */}
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-fb-text border border-fb-border rounded-lg hover:bg-fb-surface transition-colors"
            >
              Entrar
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        </SignedIn>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden text-fb-text-secondary hover:text-fb-text"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          aria-controls="dark-header-mobile-nav"
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div
          id="dark-header-mobile-nav"
          className="absolute top-full left-0 right-0 bg-fb-bg border-b border-fb-border p-4 md:hidden z-50"
        >
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-fb-primary bg-fb-primary/10"
                      : "text-fb-text-secondary hover:text-fb-text hover:bg-fb-surface"
                  }`}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {/* Mobile search */}
          <div className="mt-3 flex items-center gap-2 bg-fb-surface rounded-lg px-3 py-2">
            <Search className="size-4 text-fb-text-muted" />
            <input
              type="text"
              name="player-search-mobile"
              autoComplete="off"
              placeholder="Buscar jogador..."
              aria-label="Buscar jogador"
              onKeyDown={handleSearchKeyDown}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent text-sm text-fb-text placeholder:text-fb-text-muted outline-none w-full"
            />
          </div>
          {/* Mobile search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-fb-surface rounded-lg overflow-hidden">
              {searchResults.map((r) => (
                <Link
                  key={r.id}
                  href={`/player/${r.id}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-fb-surface-highlight transition-colors"
                >
                  <div className="size-7 rounded-full bg-fb-primary/10 flex items-center justify-center text-fb-primary text-xs font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <span className="text-sm text-fb-text">{r.name}</span>
                </Link>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 &&
            searchResults.length === 0 &&
            !searching && (
              <HeaderSearchEmptyState className="mt-2 bg-fb-surface rounded-lg p-3" />
            )}
        </div>
      )}
    </header>
  );
}
