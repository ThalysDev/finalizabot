"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  Activity,
  BarChart3,
  Bell,
  LayoutDashboard,
  Search,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

const navLinks = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/dashboard/table", label: "Tabela Avançada", icon: BarChart3 },
  { href: "/live", label: "Ao Vivo", icon: Activity },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/pricing", label: "Planos", icon: Zap },
];

interface SearchResult {
  id: string;
  name: string;
  position: string;
}

export function DarkHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
      setSearchOpen(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  function handleResultClick() {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-fb-border bg-fb-bg/95 backdrop-blur-md px-4 md:px-6 py-3">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6 md:gap-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-fb-text"
        >
          <div className="size-8 rounded-lg bg-fb-primary/20 flex items-center justify-center text-fb-primary">
            <Zap className="size-5" />
          </div>
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
        {/* Search */}
        <div ref={searchRef} className="hidden md:block relative">
          <div className="flex items-center gap-2 bg-fb-surface rounded-xl px-3 py-2 min-w-[200px] border border-fb-border/50 transition-all duration-200 focus-within:border-fb-primary/30 focus-within:ring-1 focus-within:ring-fb-primary/20 focus-within:shadow-lg focus-within:shadow-fb-primary/5">
            <Search className="size-4 text-fb-text-muted" />
            <input
              type="text"
              placeholder="Buscar jogador..."
              aria-label="Buscar jogador"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
              className="bg-transparent text-sm text-fb-text placeholder:text-fb-text-muted outline-none w-full"
            />
            {searching && (
              <div className="size-4 border-2 border-fb-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {/* Search results dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-fb-bg border border-fb-border rounded-xl shadow-xl z-50 overflow-hidden">
              {searchResults.map((r) => (
                <Link
                  key={r.id}
                  href={`/player/${r.id}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-fb-surface transition-colors"
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
          {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-fb-bg border border-fb-border rounded-xl shadow-xl z-50 p-4">
              <p className="text-xs text-fb-text-muted text-center">
                Nenhum jogador encontrado
              </p>
            </div>
          )}
        </div>

        {/* Auth */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-fb-text border border-fb-border rounded-lg hover:bg-fb-surface transition-colors">
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
          className="md:hidden text-fb-text-secondary hover:text-fb-text"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-fb-bg border-b border-fb-border p-4 md:hidden z-50">
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
              placeholder="Buscar jogador..."
              aria-label="Buscar jogador"
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
        </div>
      )}
    </header>
  );
}
