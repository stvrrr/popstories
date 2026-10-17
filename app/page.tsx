"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Heart,
  Home,
  Leaf,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Moon,
  PenLine,
  Pin,
  Plus,
  Search,
  Send,
  Settings2,
  Share2,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Fragment, useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Story = {
  id: string;
  authorId: string;
  title: string;
  excerpt: string;
  author: string;
  handle: string;
  initials: string;
  category: string;
  readTime: string;
  date: string;
  createdAt?: string;
  accent: string;
  likes: number;
  avatarUrl: string;
  isPinned?: boolean;
  pinLabel?: string | null;
};
type Profile = { id?: string; username: string; display_name: string; bio: string; avatar_url: string; profile_links: string[] };
type NotificationItem = {
  id: string;
  kind: "like" | "favorite" | "comment" | "follow";
  actor: string;
  actorAvatar: string | null;
  storyTitle?: string;
  detail?: string;
  createdAt: string;
};
const PROFILE_LINK_LIMIT = 3;
const BLOCKED_PROFILE_LINK_PATTERNS = ["nsfw", "adult", "porn", "xxx", "sex", "18+", "18plus", "onlyfans", "fetish", "lewd", "nude", "erotic"];
const STORY_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Nunito", "Raleway",
  "Ubuntu", "Merriweather", "Lora", "Playfair Display", "Source Sans 3", "Oswald",
  "PT Sans", "PT Serif", "Roboto Slab", "Crimson Text", "Libre Baskerville",
  "Cormorant Garamond", "EB Garamond", "Fira Sans", "Fira Code", "Inconsolata",
  "Quicksand", "Rubik", "Work Sans", "DM Sans", "DM Serif Display", "Josefin Sans",
  "Karla", "Manrope", "Mulish", "Cabin", "Arvo", "Bitter", "Barlow", "Archivo",
  "Anton", "Bebas Neue", "Pacifico", "Dancing Script", "Great Vibes", "Caveat",
  "Lobster", "Abril Fatface", "Cinzel", "Righteous",
];

function normalizeProfileLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, PROFILE_LINK_LIMIT);
}

function loadStoryFont(font: string) {
  if (typeof document === "undefined" || !STORY_FONTS.includes(font)) return;
  const id = `story-font-${font.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const params = new URLSearchParams({ family: font, display: "swap" });
  link.href = `https://fonts.googleapis.com/css2?${params.toString()}`;
  document.head.append(link);
}

function sanitizeStoryMarkup(markup: string): string {
  const parsed = new DOMParser().parseFromString(markup, "text/html");
  const output = document.createElement("div");
  const allowedTags = new Set(["DIV", "P", "SPAN", "STRONG", "B", "EM", "I", "BR"]);
  const blockedTags = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG", "MATH"]);

  const copyNode = (node: Node, parent: HTMLElement) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent ?? ""));
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (blockedTags.has(node.tagName)) return;
    if (!allowedTags.has(node.tagName)) {
      node.childNodes.forEach((child) => copyNode(child, parent));
      return;
    }

    const clean = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === "SPAN") {
      const font = node.style.fontFamily.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "");
      if (font && STORY_FONTS.includes(font)) {
        clean.style.fontFamily = `"${font}"`;
        loadStoryFont(font);
      }
    }
    node.childNodes.forEach((child) => copyNode(child, clean));
    parent.append(clean);
  };

  parsed.body.childNodes.forEach((node) => copyNode(node, output));
  return output.innerHTML;
}

function prepareStoryEditorContent(content: string): string {
  if (/<(?:div|p|span|strong|b|em|i|br)\b/i.test(content)) {
    return sanitizeStoryMarkup(content);
  }
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
  return sanitizeStoryMarkup(escaped);
}

function storyMarkupToReact(markup: string): React.ReactNode[] {
  const parsed = new DOMParser().parseFromString(sanitizeStoryMarkup(markup), "text/html");
  const renderNode = (node: Node, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (!(node instanceof HTMLElement)) return null;
    if (node.tagName === "BR") return <br key={key} />;

    const children = Array.from(node.childNodes).map((child, index) =>
      renderNode(child, `${key}-${index}`),
    );
    if (node.tagName === "STRONG" || node.tagName === "B") return <strong key={key}>{children}</strong>;
    if (node.tagName === "EM" || node.tagName === "I") return <em key={key}>{children}</em>;
    if (node.tagName === "P" || node.tagName === "DIV") return <p key={key}>{children}</p>;
    if (node.tagName === "SPAN") {
      const font = node.style.fontFamily.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "");
      const style = font && STORY_FONTS.includes(font) ? { fontFamily: `"${font}"` } : undefined;
      if (font && STORY_FONTS.includes(font)) loadStoryFont(font);
      return <span key={key} style={style}>{children}</span>;
    }
    return <Fragment key={key}>{children}</Fragment>;
  };

  return Array.from(parsed.body.childNodes).map((node, index) =>
    renderNode(node, `story-${index}`),
  );
}

function sanitizeProfileLinks(linkValues: string[]) {
  const cleaned = linkValues
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, PROFILE_LINK_LIMIT);

  const sanitized: string[] = [];
  const seen = new Set<string>();

  for (const rawLink of cleaned) {
    const candidate = /^https?:\/\//i.test(rawLink) ? rawLink : rawLink.startsWith("www.") ? `https://${rawLink}` : `https://${rawLink}`;

    try {
      const parsed = new URL(candidate);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid link protocol.");
      }

      const blockedText = `${parsed.hostname} ${parsed.pathname} ${parsed.search}`.toLowerCase();
      if (BLOCKED_PROFILE_LINK_PATTERNS.some((pattern) => blockedText.includes(pattern))) {
        throw new Error("NSFW or 18+ profile links are not allowed.");
      }

      const normalized = parsed.toString().replace(/\/$/, "");
      if (!seen.has(normalized)) {
        sanitized.push(normalized);
        seen.add(normalized);
      }
    } catch {
      throw new Error("Each profile link must be a valid URL and cannot be NSFW or 18+.");
    }
  }

  return sanitized;
}

function getReadTime(text: string) {
  const words = text.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function formatOrdinalDate(date = new Date()) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11
    ? "st"
    : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";
  return `${weekday}, ${month} ${day}${suffix}`;
}

const PAGE_LIMIT = 1000;
const GENRES = [
  "Personal essay",
  "Memoir",
  "Short fiction",
  "Literary fiction",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Fantasy",
  "Science fiction",
  "Historical fiction",
  "Adventure",
  "Poetry",
  "Humor",
  "Satire",
  "Coming of age",
  "Travel",
  "Nature",
  "Food",
  "Culture",
  "Relationships",
  "Family",
  "Wellness",
  "Self-growth",
  "Opinion",
  "Journalism",
  "Technology",
  "Work and career",
  "Spirituality",
  "Creative nonfiction",
];
const navItems = [
  { label: "Discover", icon: Home },
  { label: "Following", icon: Users },
  { label: "Dashboard", icon: BarChart3 },
];
type MobileNavigation = "bottom" | "left" | "right";
const chartData: number[] = [];
const supabase = createClient();
const ADMIN_USER_ID = "b3cf6d3d-3f8c-43f1-92b6-b07b115accde";

export default function HomePage() {
  const [view, setView] = useState("Discover");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileNavigation, setMobileNavigation] = useState<MobileNavigation>("left");
  const [themePreferenceLoaded, setThemePreferenceLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [readingStory, setReadingStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [followingPeople, setFollowingPeople] = useState<FollowPerson[]>([]);
  const [toast, setToast] = useState("");
  const [pages, setPages] = useState([""]);
  const [activePage, setActivePage] = useState(0);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [storyVisibility, setStoryVisibility] = useState<"public" | "followers" | "private">("public");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [publicProfileUsername, setPublicProfileUsername] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [siteImageUrl, setSiteImageUrl] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem("popstories-theme");
      if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
      const storedNavigation = window.localStorage.getItem("popstories-mobile-navigation");
      if (storedNavigation === "bottom" || storedNavigation === "left" || storedNavigation === "right") {
        setMobileNavigation(storedNavigation);
      }
    } catch (error) {
      console.error("Could not read saved display preferences.", error);
    }
    setThemePreferenceLoaded(true);
  }, []);
  useEffect(() => {
    if (!themePreferenceLoaded) return;
    try {
      window.localStorage.setItem("popstories-theme", theme);
    } catch (error) {
      console.error("Could not save the theme preference.", error);
    }
  }, [theme, themePreferenceLoaded]);
  useEffect(() => {
    if (!themePreferenceLoaded) return;
    try {
      window.localStorage.setItem("popstories-mobile-navigation", mobileNavigation);
    } catch (error) {
      console.error("Could not save the mobile navigation preference.", error);
    }
  }, [mobileNavigation, themePreferenceLoaded]);
  const refreshSavedState = async (userId: string | null) => {
    if (!userId) {
      setSaved([]);
      return;
    }
    const { data } = await supabase.from("favorites").select("story_id").eq("user_id", userId);
    setSaved((data ?? []).map((row: { story_id: string }) => row.story_id));
  };
  const refreshFollowingState = async (userId: string | null) => {
    if (!userId) {
      setFollowing([]);
      setFollowingPeople([]);
      return;
    }

    const { data } = await supabase
      .from("follows")
      .select("following_id,created_at,profiles!follows_following_id_fkey(id,username,display_name,avatar_url)")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });

    const nextFollowing = (data ?? []).flatMap((row: { following_id?: string; profiles?: FollowPerson | FollowPerson[] | null }) => {
      if (!row.following_id) return [];
      return [row.following_id];
    });

    const people = (data ?? []).flatMap((row: { profiles?: FollowPerson | FollowPerson[] | null }) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return profile ? [profile] : [];
    });

    setFollowing(nextFollowing);
    setFollowingPeople(people);
  };
  const loadStories = async () => {
    const storySelect = "id,title,excerpt,category,created_at,author_id,is_pinned,pin_label,profiles!stories_author_id_fkey(username,display_name,avatar_url),likes(count)";
    let { data, error } = await supabase
      .from("stories")
      .select(storySelect)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("published_at", { ascending: false });
    if (error) {
      ({ data } = await supabase
        .from("stories")
        .select("id,title,excerpt,category,created_at,author_id,profiles!stories_author_id_fkey(username,display_name,avatar_url),likes(count)")
        .eq("status", "published")
        .eq("visibility", "public")
        .order("published_at", { ascending: false }));
    }
    const loaded = (data ?? []) as Array<{
      id: string;
      author_id: string;
      title: string;
      excerpt: string | null;
      category: string | null;
      created_at: string;
      is_pinned?: boolean;
      pin_label?: string | null;
      profiles: { username: string; display_name: string; avatar_url: string | null } | { username: string; display_name: string; avatar_url: string | null }[] | null;
      likes: Array<{ count: number }>;
    }>;
    const pageContent = await Promise.all(loaded.map(async (story) => {
      const { data: pages } = await supabase.from("story_pages").select("content").eq("story_id", story.id);
      return pages?.map((page: { content: string }) => page.content).join(" ") ?? story.excerpt ?? "";
    }));
    setStories(
      loaded.map((story, index) => {
        const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
        return {
        id: story.id,
          authorId: story.author_id,
        title: story.title,
        excerpt: story.excerpt ?? "",
        author: profile?.display_name ?? "Anonymous writer",
        handle: profile?.username ?? "writer",
        initials: (profile?.display_name ?? "AW")
          .slice(0, 2)
          .toUpperCase(),
        category: story.category ?? "Personal essays",
        readTime: getReadTime(pageContent[index]),
        date: new Date(story.created_at).toLocaleDateString(),
        createdAt: story.created_at,
        accent: ["sage", "terracotta", "mustard"][index % 3],
        likes: story.likes?.[0]?.count ?? 0,
        avatarUrl: profile?.avatar_url ?? "",
        isPinned: story.is_pinned ?? false,
        pinLabel: story.is_pinned ? story.pin_label : null,
        };
      }),
    );
  };
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user: User | null } | null) => setUser(session?.user ?? null),
    );
    void loadStories();
    supabase.from("site_settings").select("site_image_url").eq("id", true).maybeSingle().then(({ data }: { data: { site_image_url: string | null } | null }) => setSiteImageUrl(data?.site_image_url ?? null));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
  useEffect(() => {
    if (!stories.length) return;
    const storyId = new URLSearchParams(window.location.search).get("story");
    if (!storyId) return;
    const sharedStory = stories.find((story) => story.id === storyId);
    if (!sharedStory) return;
    setReadingStory(sharedStory);
    window.history.replaceState({}, "", window.location.pathname);
  }, [stories]);
  useEffect(() => {
    if (!user) { setLiked([]); setSaved([]); setFollowing([]); return; }
    Promise.all([
      supabase.from("likes").select("story_id").eq("user_id", user.id),
      supabase.from("favorites").select("story_id").eq("user_id", user.id),
    ]).then(([likesResult, favoritesResult]) => {
      setLiked((likesResult.data ?? []).map((row: { story_id: string }) => row.story_id));
      setSaved((favoritesResult.data ?? []).map((row: { story_id: string }) => row.story_id));
    });
    void refreshFollowingState(user.id);
  }, [user]);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const result =
      authMode === "login"
        ? await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
          })
        : await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
          });
    setAuthLoading(false);
    if (result.error) {
      setAuthError(result.error.message);
      return;
    }
    setAuthOpen(false);
    setAuthEmail("");
    setAuthPassword("");
    notify(
      authMode === "login"
        ? "Welcome back"
        : "Check your email to confirm your account",
    );
  };
  const handleDiscordLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setAuthLoading(false);
      setAuthError(error.message);
    }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    notify("You have been signed out");
  };
  const handleAccountDeleted = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setView("Discover");
    notify(error ? `Account deleted, but sign-out failed: ${error.message}` : "Your account has been permanently deleted");
  };
  const toggleLike = async (story: Story) => {
    if (!user) { setAuthMode("login"); setAuthOpen(true); return; }
    const alreadyLiked = liked.includes(story.id);
    const result = alreadyLiked
      ? await supabase.from("likes").delete().eq("user_id", user.id).eq("story_id", story.id)
      : await supabase.from("likes").insert({ user_id: user.id, story_id: story.id });
    if (result.error) { notify(result.error.message); return; }
    setLiked((current) => alreadyLiked ? current.filter((id) => id !== story.id) : [...current, story.id]);
    await loadStories();
  };
  const toggleSave = async (story: Story) => {
    if (!user) { setAuthMode("login"); setAuthOpen(true); return; }
    const alreadySaved = saved.includes(story.id);
    const result = alreadySaved
      ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("story_id", story.id)
      : await supabase.from("favorites").insert({ user_id: user.id, story_id: story.id });
    if (result.error) { notify(result.error.message); return; }
    await refreshSavedState(user.id);
    notify(alreadySaved ? "Removed from your shelf" : "Saved to your shelf");
  };
  const shareStory = async (story: Story) => {
    const result = await supabase.from("story_shares").insert({ story_id: story.id, user_id: user?.id ?? null });
    if (result.error) { notify(result.error.message); return; }
    try { await navigator.clipboard.writeText(`${window.location.origin}/?story=${story.id}`); } catch { /* Clipboard access can be unavailable in some browsers. */ }
    notify("Story link copied to your clipboard");
  };
  const updatePage = (value: string) => {
    const next = [...pages];
    next[activePage] = value;
    setPages(next);
  };
  const addPage = () => {
    setPages([...pages, ""]);
    setActivePage(pages.length);
  };
  const deletePage = () => {
    if (pages.length === 1) {
      notify("A story needs at least one page");
      return;
    }
    const nextPages = pages.filter((_, index) => index !== activePage);
    setPages(nextPages);
    setActivePage(Math.min(activePage, nextPages.length - 1));
  };
  const toggleFollow = async (story: Story) => {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", story.handle)
      .maybeSingle();

    if (!profileRow) {
      notify("That profile could not be found.");
      return;
    }

    const isFollowing = following.includes(story.authorId);
    const result = isFollowing
      ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileRow.id)
      : await supabase.from("follows").insert({ follower_id: user.id, following_id: profileRow.id });

    if (result.error) {
      notify(result.error.message);
      return;
    }

    await refreshFollowingState(user.id);
    notify(isFollowing ? `Unfollowed ${story.author}` : `Following ${story.author}`);
  };
  const publishStory = async () => {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    if (!storyTitle.trim() || !pages.some((page) => page.trim())) {
      notify("Add a title and some story text first");
      return;
    }
    if (!storyDescription.trim()) {
      notify("Add a short description for your story");
      return;
    }
    const excerpt = storyDescription.trim().slice(0, 240);
    const category = selectedGenres.join(", ") || "Personal essay";
    if (editingStoryId) {
      const { error } = await supabase.from("stories").update({ title: storyTitle.trim(), excerpt, category, visibility: storyVisibility, updated_at: new Date().toISOString() }).eq("id", editingStoryId).eq("author_id", user.id);
      if (error) { notify(error.message); return; }
      await supabase.from("story_pages").delete().eq("story_id", editingStoryId);
      const { error: pageError } = await supabase.from("story_pages").insert(pages.map((content, index) => ({ story_id: editingStoryId, page_number: index + 1, content })));
      if (pageError) { notify(pageError.message); return; }
      setEditingStoryId(null); setStoryTitle(""); setStoryDescription(""); setSelectedGenres([]); setStoryVisibility("public"); setPages([""]); setActivePage(0); await loadStories(); setView("Shelf"); notify("Your story was updated"); return;
    }
    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        author_id: user.id,
        title: storyTitle.trim(),
        excerpt,
        category,
        visibility: storyVisibility,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !story) {
      notify(error?.message ?? "Could not publish story");
      return;
    }
    const { error: pagesError } = await supabase
      .from("story_pages")
      .insert(
        pages.map((content, index) => ({
          story_id: story.id,
          page_number: index + 1,
          content,
        })),
      );
    if (pagesError) {
      await supabase.from("stories").delete().eq("id", story.id);
      notify(pagesError.message);
      return;
    }
    setStoryTitle("");
    setStoryDescription("");
    setSelectedGenres([]);
    setStoryVisibility("public");
    setPages([""]);
    setActivePage(0);
    await loadStories();
    setView("Discover");
    notify("Your story is live");
  };

  return (
    <div className={`app-shell ${theme === "dark" ? "dark-mode" : ""} navigation-${mobileNavigation}`}>
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            {siteImageUrl ? <img src={siteImageUrl} alt="" /> : <Coffee size={19} />}
          </div>
          <span>Flip Stories</span>
          <button
            className="sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <button className="profile-mini" onClick={() => { setView("Settings"); setMenuOpen(false); }}>
          <div className="avatar avatar-plum">
            {user ? (user.email?.[0] ?? "U").toUpperCase() : "NS"}
          </div>
          <div>
            <strong>{user ? user.email : "Sign in to Flip Stories"}</strong>
            <span>{user ? "Account settings" : "General settings"}</span>
          </div>
          <ChevronDown size={15} />
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              className={`nav-item ${view === label ? "active" : ""}`}
              key={label}
              onClick={() => {
                setView(label);
                setMenuOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Following" && <span className="nav-count">{following.length}</span>}
            </button>
          ))}
        </nav>
        <div className="nav-section-label">Your space</div>
        <nav className="main-nav">
          <button
            className={`nav-item ${view === "Write" ? "active" : ""}`}
            onClick={() => {
              setView("Write");
              setMenuOpen(false);
            }}
          >
            <PenLine size={18} />
            <span>Write a story</span>
          </button>
          <button
            className="nav-item"
            onClick={() => { setView("Shelf"); setMenuOpen(false); }}
          >
            <Bookmark size={18} />
            <span>My shelf</span>
          </button>
          <button className={`nav-item ${view === "Settings" ? "active" : ""}`} onClick={() => { setView("Settings"); setMenuOpen(false); }}>
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
          {user?.id === ADMIN_USER_ID && <button className={`nav-item ${view === "Admin" ? "active" : ""}`} onClick={() => { setView("Admin"); setMenuOpen(false); }}><BarChart3 size={18} /><span>Admin panel</span></button>}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={17} />
            <p>
              <strong>Small stories matter.</strong>
              <br />
              Make room for yours.
            </p>
          </div>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <Menu size={21} />
          </button>
          <div className="crumb">
            <span>Library</span>
            <ChevronRight size={14} />
            <strong>{view}</strong>
          </div>
          <div className="top-actions">
            <button
              className="icon-button notification-button"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span />
            </button>
            {notificationsOpen && <NotificationPanel user={user} />}
            <button className="avatar avatar-plum avatar-small" onClick={() => setView("Settings")} aria-label="Open settings">{user?.email?.[0]?.toUpperCase() ?? "NS"}</button>
          </div>
        </header>
        {view === "Discover" && (
          <Discover
            setView={setView}
            setReadingStory={setReadingStory}
            stories={stories}
            liked={liked}
            saved={saved}
            following={following}
            onLike={toggleLike}
            onSave={toggleSave}
            onFollow={toggleFollow}
            onAuthor={(username) => { setPublicProfileUsername(username); setView("PublicProfile"); }}
          />
        )}
        {view === "Following" && (
          <FollowingView
            setView={setView}
            user={user}
            followingPeople={followingPeople}
            stories={stories.filter((story) =>
              following.includes(story.authorId),
            )}
            liked={liked}
            saved={saved}
            following={following}
            onLike={toggleLike}
            onSave={toggleSave}
            onFollow={toggleFollow}
            onRead={setReadingStory}
            onAuthor={(username) => { setPublicProfileUsername(username); setView("PublicProfile"); }}
          />
        )}
        {view === "Dashboard" && (
          <Dashboard onWrite={() => setView("Write")} user={user} />
        )}
        {view === "Settings" && <SettingsView user={user} theme={theme} setTheme={setTheme} mobileNavigation={mobileNavigation} setMobileNavigation={setMobileNavigation} onSignOut={handleSignOut} onDeleted={handleAccountDeleted} onSaved={async () => { await loadStories(); setView("Discover"); }} />}
        {view === "PublicProfile" && publicProfileUsername && (
          <PublicProfile
            username={publicProfileUsername}
            user={user}
            following={following}
            setAuthMode={setAuthMode}
            setAuthOpen={setAuthOpen}
            notify={notify}
            refreshFollowingState={refreshFollowingState}
            onAuthor={(username) => { setPublicProfileUsername(username); setView("PublicProfile"); }}
            onBack={() => setView("Discover")}
            onRead={setReadingStory}
          />
        )}
        {view === "Admin" && user?.id === ADMIN_USER_ID && <AdminPanel />}
        {view === "Shelf" && (
          <ShelfView
            user={user}
            discoverStories={stories}
            saved={saved}
            liked={liked}
            following={following}
            onLike={toggleLike}
            onSave={toggleSave}
            onFollow={toggleFollow}
            onRead={setReadingStory}
            onAuthor={(username) => { setPublicProfileUsername(username); setView("PublicProfile"); }}
            onWrite={() => { setEditingStoryId(null); setView("Write"); }}
            onEdit={async (storyId) => {
            const [{ data: story }, { data: pageRows }] = await Promise.all([
              supabase.from("stories").select("id,title,excerpt,category,visibility").eq("id", storyId).single(),
              supabase.from("story_pages").select("page_number,content").eq("story_id", storyId).order("page_number"),
            ]);
            if (!story) { notify("That story could not be found"); return; }
            setEditingStoryId(story.id);
            setStoryTitle(story.title);
            setStoryDescription(story.excerpt ?? "");
            setSelectedGenres(story.category ? story.category.split(", ").filter((genre: string) => GENRES.includes(genre)).slice(0, 3) : []);
            setStoryVisibility(story.visibility ?? "public");
            setPages(pageRows?.map((page: { content: string }) => page.content) ?? [""]);
            setActivePage(0);
            setView("Write");
          }} onDelete={async (storyId) => {
            const { error } = await supabase.from("stories").delete().eq("id", storyId);
            if (error) { notify(error.message); return; }
            await loadStories();
            notify("Story deleted");
          }}
          />
        )}
        {view === "Write" && (
          <Writer
            setView={setView}
            user={user}
            storyTitle={storyTitle}
            setStoryTitle={setStoryTitle}
            storyDescription={storyDescription}
            setStoryDescription={setStoryDescription}
            selectedGenres={selectedGenres}
            setSelectedGenres={setSelectedGenres}
            storyVisibility={storyVisibility}
            setStoryVisibility={setStoryVisibility}
            pages={pages}
            activePage={activePage}
            setActivePage={setActivePage}
            updatePage={updatePage}
            addPage={addPage}
            deletePage={deletePage}
            notify={notify}
            onPublish={publishStory}
            editing={Boolean(editingStoryId)}
          />
        )}
      </main>
      <nav className="mobile-bottom-nav" aria-label="Bottom navigation">
        {[
          { label: "Discover", icon: Home, view: "Discover" },
          { label: "Following", icon: Users, view: "Following" },
          { label: "Dashboard", icon: BarChart3, view: "Dashboard" },
          { label: "Write", icon: PenLine, view: "Write" },
          { label: "My shelf", icon: Bookmark, view: "Shelf" },
          { label: "Settings", icon: Settings2, view: "Settings" },
          ...(user?.id === ADMIN_USER_ID ? [{ label: "Admin", icon: BarChart3, view: "Admin" }] : []),
        ].map(({ label, icon: Icon, view: targetView }) => {
          return (
            <button
              type="button"
              key={label}
              className={view === targetView ? "active" : ""}
              aria-current={view === targetView ? "page" : undefined}
              onClick={() => { setView(targetView); setMenuOpen(false); }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Following" && <small>{following.length}</small>}
            </button>
          );
        })}
      </nav>
      {readingStory && (
        <ReaderModal
          story={readingStory}
          user={user}
          liked={liked.includes(readingStory.id)}
          saved={saved.includes(readingStory.id)}
          following={following.includes(readingStory.authorId)}
          onClose={() => setReadingStory(null)}
          onLike={() => toggleLike(readingStory)}
          onSave={() => toggleSave(readingStory)}
          onFollow={() => void toggleFollow(readingStory)}
          onAuthor={() => { setReadingStory(null); setPublicProfileUsername(readingStory.handle); setView("PublicProfile"); }}
          onShare={() => void shareStory(readingStory)}
          onViewError={(message) => notify(`View was not recorded: ${message}`)}
          setAuthMode={setAuthMode}
          setAuthOpen={setAuthOpen}
        />
      )}
      {authOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          email={authEmail}
          setEmail={setAuthEmail}
          password={authPassword}
          setPassword={setAuthPassword}
          error={authError}
          loading={authLoading}
          onSubmit={handleAuth}
            onDiscordLogin={handleDiscordLogin}
          onClose={() => setAuthOpen(false)}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={16} /> {toast}
        </div>
      )}
    </div>
  );
}

function Discover({
  setView,
  setReadingStory,
  stories,
  liked,
  saved,
  following,
  onLike,
  onSave,
  onFollow,
  onAuthor,
}: {
  setView: (view: string) => void;
  setReadingStory: (story: Story) => void;
  stories: Story[];
  liked: string[];
  saved: string[];
  following: string[];
  onLike: (story: Story) => void;
  onSave: (story: Story) => void;
  onFollow: (story: Story) => void;
  onAuthor: (username: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [storyFilter, setStoryFilter] = useState("all");

  if (!stories.length) {
    return (
      <section className="content-wrap empty-feed">
        <p className="eyebrow"><BookOpen size={14} /> The reading room</p>
        <h1>There are no published stories <em>yet.</em></h1>
        <p className="subtitle">Be the first person to leave something kind on the table.</p>
        <button className="primary-button" onClick={() => setView("Write")}><PenLine size={17} /> Write the first story</button>
      </section>
    );
  }
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingStories = stories.filter((story) => {
    const matchesTitle = !normalizedQuery || story.title.toLowerCase().includes(normalizedQuery);
    const matchesGenre = genreFilter === "all" || story.category.split(", ").includes(genreFilter);
    return matchesTitle && matchesGenre;
  });
  const now = Date.now();
  const filteredStories = matchingStories
    .filter((story) => {
      const ageInDays = (now - new Date(story.createdAt ?? story.date).getTime()) / 86400000;
      const readMinutes = Number.parseInt(story.readTime, 10);
      if (storyFilter === "hot") return ageInDays >= 0 && ageInDays <= 7 && story.likes > 0;
      if (storyFilter === "short") return readMinutes <= 5;
      if (storyFilter === "long") return readMinutes > 5;
      return true;
    })
    .sort((left, right) => {
      if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
      if (storyFilter === "popular" || storyFilter === "hot") return right.likes - left.likes;
      if (storyFilter === "recent") return new Date(right.createdAt ?? right.date).getTime() - new Date(left.createdAt ?? left.date).getTime();
      return 0;
    });
  return (
    <section className="content-wrap">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">
            <Leaf size={14} /> {formatOrdinalDate()}
          </p>
          <h1>
            A quiet place for <em>good stories.</em>
          </h1>
          <p className="subtitle">
            Pull up a chair. There&apos;s something new to read.
          </p>
        </div>
        <button className="primary-button" onClick={() => setView("Write")}>
          <PenLine size={17} /> Write a story
        </button>
      </div>
      <div className="section-heading">
        <div>
          <span className="section-kicker">The reading room</span>
          <h2>Stories from the community</h2>
        </div>
        <button
          className="text-button muted-button"
          onClick={() => setView("Following")}
        >
          View all <ChevronRight size={15} />
        </button>
      </div>
      <div className="discover-filters">
        <label className="discover-search">
          <Search size={17} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search story titles"
            aria-label="Search story titles"
          />
        </label>
        <label className="discover-genre-filter">
          <span>Genre</span>
          <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} aria-label="Filter stories by genre">
            <option value="all">All genres</option>
            {GENRES.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
          </select>
        </label>
        <label className="discover-genre-filter">
          <span>Browse</span>
          <select value={storyFilter} onChange={(event) => setStoryFilter(event.target.value)} aria-label="Filter stories by popularity and length">
            <option value="all">All stories</option>
            <option value="popular">Popular</option>
            <option value="hot">Hot</option>
            <option value="recent">New / Recent</option>
            <option value="short">Short read</option>
            <option value="long">Long read</option>
          </select>
        </label>
      </div>
      <div className="story-list">
        {filteredStories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            liked={liked.includes(story.id)}
            saved={saved.includes(story.id)}
            following={following.includes(story.authorId)}
            onLike={() => onLike(story)}
            onSave={() => onSave(story)}
            onFollow={() => onFollow(story)}
            onRead={() => setReadingStory(story)}
            onAuthor={() => onAuthor(story.handle)}
          />
        ))}
      </div>
      {!filteredStories.length && (
        <div className="discover-empty-filter">
          <Search size={20} />
          <p>No stories match that search.</p>
        </div>
      )}
    </section>
  );
}

function FollowingView({
  setView,
  user,
  followingPeople,
  stories,
  liked,
  saved,
  following,
  onLike,
  onSave,
  onFollow,
  onRead,
  onAuthor,
}: {
  setView: (view: string) => void;
  user: User | null;
  followingPeople: FollowPerson[];
  stories: Story[];
  liked: string[];
  saved: string[];
  following: string[];
  onLike: (story: Story) => void;
  onSave: (story: Story) => void;
  onFollow: (story: Story) => void;
  onRead: (story: Story) => void;
  onAuthor: (username: string) => void;
}) {
  if (!stories.length) {
    return (
      <section className="content-wrap empty-feed">
        <p className="eyebrow"><Users size={14} /> Your circle</p>
        <h1>Your following list is <em>quiet.</em></h1>
        <p className="subtitle">Follow writers from Discover to see their new stories here.</p>
        <FollowDirectory user={user} onAuthor={onAuthor} />
        <button className="text-button" onClick={() => setView("Discover")}>Browse Discover <ChevronRight size={15} /></button>
      </section>
    );
  }
  return (
    <section className="content-wrap compact-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <Users size={14} /> Your circle
          </p>
          <h1>
            Stories from people <em>you follow.</em>
          </h1>
          <p className="subtitle">A little closer to home.</p>
        </div>
        <button className="primary-button" onClick={() => setView("Write")}>
          <PenLine size={17} /> Write a story
        </button>
      </div>
      <div className="following-banner">
        <div className="stacked-avatars" aria-label="People you recently followed">
          {followingPeople.slice(0, 3).map((person) => (
            <div className="avatar avatar-sage" key={person.id} title={person.display_name}>
              {person.avatar_url ? <img src={person.avatar_url} alt={person.display_name} /> : person.display_name.slice(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
        <span>
          You&apos;re following <strong>{following.length} writers</strong>
        </span>
        <button className="text-button" onClick={() => setView("Discover")}>
          Find more writers <ChevronRight size={15} />
        </button>
      </div>
      <FollowDirectory user={user} onAuthor={onAuthor} />
      <div className="story-list following-list">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            liked={liked.includes(story.id)}
            saved={saved.includes(story.id)}
            following={following.includes(story.authorId)}
            onLike={() => onLike(story)}
            onSave={() => onSave(story)}
            onFollow={() => onFollow(story)}
            onRead={() => onRead(story)}
            onAuthor={() => onAuthor(story.handle)}
          />
        ))}
      </div>
    </section>
  );
}

function StoryCard({
  story,
  liked,
  saved,
  following,
  onLike,
  onSave,
  onFollow,
  onRead,
  onAuthor,
}: {
  story: Story;
  liked: boolean;
  saved: boolean;
  following: boolean;
  onLike: () => void;
  onSave: () => void;
  onFollow: () => void;
  onRead: () => void;
  onAuthor: () => void;
}) {
  return (
    <article className="story-card" onClick={onRead} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onRead(); }} role="button" tabIndex={0}>
      <div className={`story-art story-art-${story.accent}`}>
        <div className="art-shape-one" />
        <div className="art-shape-two" />
        <BookOpen size={22} />
      </div>
      <div className="story-card-main">
        <div className="story-card-meta">
          <span className="story-category">{story.category}</span>
          {story.pinLabel && <span className="pin-badge"><Pin size={11} /> {story.pinLabel}</span>}
          <span>{story.date}</span>
        </div>
        <h3>{story.title}</h3>
        <p>{story.excerpt}</p>
        <div className="story-card-bottom">
          <button type="button" className="author-chip" onClick={(event) => { event.stopPropagation(); onAuthor(); }} aria-label={`Open ${story.author}'s profile`}>
            {story.avatarUrl ? <img className="avatar avatar-image" src={story.avatarUrl} alt="" /> : <span className={`avatar avatar-${story.accent}`}>{story.initials}</span>}
            <span>
              <strong>{story.author}</strong>
              <small>{following ? "Following" : `@${story.handle}`}</small>
            </span>
          </button>
          <button
            className={`follow-chip ${following ? "following" : ""}`}
            onClick={(event) => { event.stopPropagation(); onFollow(); }}
            aria-label={following ? `Unfollow ${story.author}` : `Follow ${story.author}`}
          >
            {following ? "Following" : "Follow"}
          </button>
          <span className="read-time">{story.readTime}</span>
          <div className="story-actions">
            <button
              className={liked ? "liked" : ""}
              onClick={(event) => { event.stopPropagation(); onLike(); }}
              aria-label="Like story"
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
              <span>{story.likes}</span>
            </button>
            <button
              className={saved ? "saved" : ""}
              onClick={(event) => { event.stopPropagation(); onSave(); }}
              aria-label="Save story"
            >
              <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
            </button>
            <button onClick={(event) => { event.stopPropagation(); onRead(); }} className="read-link">
              Read <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

type FollowPerson = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

function FollowDirectory({ user, profileId, counts, onAuthor }: { user: User | null; profileId?: string; counts?: { following: number; followers: number }; onAuthor: (username: string) => void }) {
  const [tab, setTab] = useState<"following" | "followers">("following");
  const [people, setPeople] = useState<FollowPerson[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const targetId = profileId ?? user?.id;
    if (!targetId) {
      setPeople([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      const isFollowingTab = tab === "following";
      const relation = isFollowingTab ? "profiles!follows_following_id_fkey" : "profiles!follows_follower_id_fkey";
      const targetField = isFollowingTab ? "follower_id" : "following_id";
      const relatedField = isFollowingTab ? "following_id" : "follower_id";
      const { data } = await supabase
        .from("follows")
        .select(`${relatedField},${relation}(id,username,display_name,avatar_url)`)
        .eq(targetField, targetId)
        .order("created_at", { ascending: false });
      const loaded = (data ?? []).flatMap((row: Record<string, unknown>) => {
        const profile = row.profiles;
        const person = Array.isArray(profile) ? profile[0] : profile;
        return person && typeof person === "object" ? [person as FollowPerson] : [];
      });
      setPeople(loaded);
      setLoading(false);
    };
    void load();
  }, [tab, user, profileId]);

  return (
    <div className="follow-directory">
      <div className="follow-tabs" role="tablist" aria-label="Your connections">
        <button className={tab === "following" ? "active" : ""} onClick={() => setTab("following")} role="tab" aria-selected={tab === "following"}>Following{counts ? ` ${counts.following}` : ""}</button>
        <button className={tab === "followers" ? "active" : ""} onClick={() => setTab("followers")} role="tab" aria-selected={tab === "followers"}>Followers{counts ? ` ${counts.followers}` : ""}</button>
      </div>
      {loading ? <p className="subtitle">Loading people...</p> : people.length ? <div className="people-list">{people.map((person) => <button className="person-row" key={person.id} onClick={() => onAuthor(person.username)}><span className="person-avatar">{person.avatar_url ? <img src={person.avatar_url} alt="" /> : person.display_name.slice(0, 2).toUpperCase()}</span><span><strong>{person.display_name}</strong><small>@{person.username}</small></span><ChevronRight size={15} /></button>)}</div> : <p className="subtitle">No {tab} yet.</p>}
    </div>
  );
}

function SettingsView({ user, theme, setTheme, mobileNavigation, setMobileNavigation, onSignOut, onDeleted, onSaved }: { user: User | null; theme: "light" | "dark"; setTheme: (theme: "light" | "dark") => void; mobileNavigation: MobileNavigation; setMobileNavigation: (navigation: MobileNavigation) => void; onSignOut: () => Promise<void>; onDeleted: () => Promise<void>; onSaved: () => Promise<void> }) {
  const [section, setSection] = useState<"general" | "profile">("general");
  const [profile, setProfile] = useState<Profile>({ username: "", display_name: "", bio: "", avatar_url: "", profile_links: [] });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("profiles").select("username,display_name,bio,avatar_url,profile_links").eq("id", user.id).maybeSingle().then(({ data }: { data: Profile | null }) => {
      if (data) setProfile({ username: data.username ?? "", display_name: data.display_name ?? "", bio: data.bio ?? "", avatar_url: data.avatar_url ?? "", profile_links: normalizeProfileLinks(data.profile_links ?? []) });
      setLoading(false);
    });
  }, [user]);
  useEffect(() => {
    if (!user) setSection("general");
  }, [user]);
  useEffect(() => {
    if (!deleteDialogOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || deleting) return;
      setDeleteDialogOpen(false);
      setDeletePassword("");
      setDeleteError("");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteDialogOpen, deleting]);
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setMessage("");
    if (!user) { setSaving(false); return; }
    let avatarUrl = profile.avatar_url;
    if (avatarFile) {
      const path = `${user.id}/${crypto.randomUUID()}-${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: false, contentType: avatarFile.type });
      if (uploadError) { setMessage(`Avatar upload failed: ${uploadError.message}`); setSaving(false); return; }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    let profileLinks: string[] = [];
    try {
      profileLinks = sanitizeProfileLinks(Array.from({ length: PROFILE_LINK_LIMIT }, (_, index) => profile.profile_links[index] ?? ""));
    } catch (error) {
      setSaving(false);
      setMessage(error instanceof Error ? error.message : "Please add only valid, safe profile links.");
      return;
    }

    const { error } = await supabase.from("profiles").update({ username: profile.username.trim().toLowerCase(), display_name: profile.display_name.trim(), bio: profile.bio.trim(), avatar_url: avatarUrl, profile_links: profileLinks }).eq("id", user.id).select("id").single();
    setSaving(false);
    if (error) {
      const friendly = error.code === "23505" ? "That username is already taken." :
        error.code === "PGRST116" ? "Your profile record is missing. Run the profile setup SQL in Supabase first." :
        error.message.includes("profile_links") ? "Please run the profile links migration in Supabase before saving links." : error.message;
      setMessage(friendly);
      return;
    }
    setProfile({ ...profile, avatar_url: avatarUrl, profile_links: profileLinks }); setAvatarFile(null); await onSaved();
  };
  const deleteAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setDeleteError(result.error ?? "Account deletion failed. Please try again.");
        setDeleting(false);
        return;
      }

      setDeleting(false);
      await onDeleted();
    } catch (error) {
      setDeleting(false);
      setDeleteError(error instanceof Error ? error.message : "Account deletion failed. Please try again.");
    }
  };
  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteDialogOpen(false);
    setDeletePassword("");
    setDeleteError("");
  };

  return (
    <section className="content-wrap settings-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow"><Settings2 size={14} /> Preferences</p>
          <h1>Settings</h1>
          <p className="subtitle">Make Flip Stories feel right for you.</p>
        </div>
        {section === "profile" && user && (
          <button
            className="sign-out-button"
            type="button"
            onClick={() => { if (window.confirm("Are you sure you want to sign out?")) void onSignOut(); }}
          >
            <span className="sign-out-icon"><LogOut size={17} /></span>
            <span className="sign-out-label"><strong>Sign out</strong><small>End your session</small></span>
          </button>
        )}
      </div>
      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button type="button" role="tab" aria-selected={section === "general"} className={section === "general" ? "active" : ""} onClick={() => setSection("general")}>
          <Settings2 size={16} /> General
        </button>
        {user && (
          <button type="button" role="tab" aria-selected={section === "profile"} className={section === "profile" ? "active" : ""} onClick={() => setSection("profile")}>
            <Users size={16} /> Profile
          </button>
        )}
      </div>
      {section === "general" && (
        <section className="settings-section" role="tabpanel" aria-label="General settings">
          <div className="settings-section-heading">
            <div><span className="section-kicker">Preferences</span><h2>General</h2></div>
            <p>Choose how the reading room looks and works on this device.</p>
          </div>
          <div className="settings-option">
            <span className="settings-option-icon">{theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}</span>
            <span className="settings-option-copy"><strong>Appearance</strong><small>Choose a light or dark reading room.</small></span>
            <span className="appearance-choice">
              <button type="button" className={theme === "light" ? "selected" : ""} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
                <Sun size={15} /> Light
              </button>
              <button type="button" className={theme === "dark" ? "selected" : ""} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
                <Moon size={15} /> Dark
              </button>
            </span>
          </div>
          <div className="settings-option settings-navigation-option">
            <span className="settings-option-icon"><Menu size={18} /></span>
            <span className="settings-option-copy"><strong>Mobile navigation</strong><small>Choose how to open the menu on smaller screens.</small></span>
            <span className="navigation-choice" role="group" aria-label="Mobile navigation style">
              <button type="button" className={mobileNavigation === "bottom" ? "selected" : ""} aria-pressed={mobileNavigation === "bottom"} onClick={() => setMobileNavigation("bottom")}>
                <ChevronDown size={15} /> Bottom bar
              </button>
              <button type="button" className={mobileNavigation === "left" ? "selected" : ""} aria-pressed={mobileNavigation === "left"} onClick={() => setMobileNavigation("left")}>
                <ChevronLeft size={15} /> Left
              </button>
              <button type="button" className={mobileNavigation === "right" ? "selected" : ""} aria-pressed={mobileNavigation === "right"} onClick={() => setMobileNavigation("right")}>
                <ChevronRight size={15} /> Right
              </button>
            </span>
          </div>
        </section>
      )}
      {section === "profile" && user && (loading ? <p className="subtitle">Loading profile...</p> : (
        <>
          <div className="settings-section-heading profile-section-heading">
            <div><span className="section-kicker">Your account</span><h2>Profile</h2></div>
            <p>Update how readers see you and manage your account.</p>
          </div>
          <form className="profile-form" onSubmit={saveProfile}>
            <div className="profile-preview">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="Profile avatar" />
                : <div className="avatar avatar-plum avatar-large">{(profile.display_name || user.email || "U").slice(0, 2).toUpperCase()}</div>}
              <div><strong>{profile.display_name || "Your name"}</strong><span>@{profile.username || "username"}</span></div>
            </div>
            <label>Profile photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} /></label>
            <label>Display name<input value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} required placeholder="Your name" /></label>
            <label>Username <small>Must be unique</small><input value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value.replace(/[^a-zA-Z0-9_]/g, "") })} required minLength={3} placeholder="yourhandle" /></label>
            <label>Bio<textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} maxLength={160} placeholder="A sentence about you" /></label>
            {Array.from({ length: PROFILE_LINK_LIMIT }, (_, index) => (
              <label key={`profile-link-${index}`}>Profile link {index + 1} <small>Optional</small><input value={profile.profile_links[index] ?? ""} onChange={(event) => setProfile((current) => {
                const nextLinks = Array.from({ length: PROFILE_LINK_LIMIT }, (_, nextIndex) => current.profile_links[nextIndex] ?? "");
                nextLinks[index] = event.target.value;
                return { ...current, profile_links: nextLinks };
              })} placeholder="https://your-site.com" /></label>
            ))}
            <p className="profile-hint">Up to 3 links, no NSFW or 18+ content.</p>
            {message && <p className="profile-error">{message}</p>}
            <button className="publish-button" disabled={saving}>{saving ? "Saving..." : "Save profile"} <Check size={16} /></button>
          </form>
          <section className="account-danger-zone" aria-labelledby="account-danger-title">
            <div>
              <h2 id="account-danger-title">Delete account</h2>
              <p>Permanently remove your account and associated profile data.</p>
            </div>
            <button className="delete-account-button" type="button" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 size={16} /> Delete account
            </button>
          </section>
        </>
      ))}
      {deleteDialogOpen && (
        <div className="modal-backdrop account-delete-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDeleteDialog(); }}>
          <section className="account-delete-modal" role="dialog" aria-modal="true" aria-labelledby="account-delete-title">
            <button className="modal-close" type="button" onClick={closeDeleteDialog} disabled={deleting} aria-label="Close">
              <X size={16} />
            </button>
            <span className="account-delete-mark"><Trash2 size={20} /></span>
            <p className="eyebrow">This cannot be undone</p>
            <h2 id="account-delete-title">Delete your account?</h2>
            <p className="account-delete-copy">Your account and associated profile data will be permanently removed. Enter your password to confirm it’s really you.</p>
            <form className="account-delete-form" onSubmit={deleteAccount}>
              <label htmlFor="delete-account-password">Account password</label>
              <input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                disabled={deleting}
              />
              {deleteError && <p className="profile-error" role="alert">{deleteError}</p>}
              <div className="account-delete-actions">
                <button className="quiet-button" type="button" onClick={closeDeleteDialog} disabled={deleting}>Keep my account</button>
                <button className="confirm-delete-button" type="submit" disabled={deleting || !deletePassword}>
                  <Trash2 size={15} /> {deleting ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function PublicProfile({
  username,
  user,
  following,
  setAuthMode,
  setAuthOpen,
  notify,
  refreshFollowingState,
  onAuthor,
  onBack,
  onRead,
}: {
  username: string;
  user: User | null;
  following: string[];
  setAuthMode: (mode: "login" | "signup") => void;
  setAuthOpen: (open: boolean) => void;
  notify: (message: string) => void;
  refreshFollowingState: (userId: string | null) => Promise<void>;
  onAuthor: (username: string) => void;
  onBack: () => void;
  onRead: (story: Story) => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [followCounts, setFollowCounts] = useState({ following: 0, followers: 0 });
  const isFollowing = Boolean(profile?.id && following.includes(profile.id));

  const loadFollowCounts = async (profileId: string) => {
    const [{ count: followingCount }, { count: followersCount }] = await Promise.all([
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", profileId),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", profileId),
    ]);

    setFollowCounts({
      following: followingCount ?? 0,
      followers: followersCount ?? 0,
    });
  };

  const toggleProfileFollow = async () => {
    if (!profile || !user || !profile.id) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    setLoadingFollow(true);
    const result = isFollowing
      ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id)
      : await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });

    setLoadingFollow(false);
    if (result.error) {
      notify(result.error.message);
      return;
    }

    const nextValue = !isFollowing;
    await loadFollowCounts(profile.id);
    await refreshFollowingState(user.id);
    notify(nextValue ? `Following ${profile.display_name}` : `Unfollowed ${profile.display_name}`);
  };

  useEffect(() => {
    const load = async () => {
      const { data: profileRow } = await supabase.from("profiles").select("id,username,display_name,bio,avatar_url,profile_links").eq("username", username).maybeSingle();
      if (!profileRow) return;
      setProfile({
        ...profileRow,
        bio: profileRow.bio ?? "",
        avatar_url: profileRow.avatar_url ?? "",
        profile_links: normalizeProfileLinks(profileRow.profile_links ?? []),
      } as Profile);
      const { data } = await supabase.from("stories").select("id,title,excerpt,category,created_at,profiles!stories_author_id_fkey(username,display_name,avatar_url),likes(count)").eq("author_id", profileRow.id).eq("status", "published").eq("visibility", "public").order("published_at", { ascending: false });
      setStories((data ?? []).map((story: any, index: number) => ({ id: story.id, authorId: profileRow.id, title: story.title, excerpt: story.excerpt ?? "", author: profileRow.display_name, handle: profileRow.username, initials: profileRow.display_name.slice(0, 2).toUpperCase(), category: story.category ?? "Personal essays", readTime: "5 min read", date: new Date(story.created_at).toLocaleDateString(), createdAt: story.created_at, accent: ["sage", "terracotta", "mustard"][index % 3], likes: story.likes?.[0]?.count ?? 0, avatarUrl: profileRow.avatar_url ?? "" })));
      await loadFollowCounts(profileRow.id);
    };
    void load();
  }, [username, user]);
  if (!profile) return <section className="content-wrap empty-feed"><button className="text-button" onClick={onBack}><ChevronLeft size={15} /> Back</button><h1>Profile not found.</h1></section>;
  return <section className="content-wrap public-profile-wrap"><button className="text-button" onClick={onBack}><ChevronLeft size={15} /> Back to Discover</button><div className="public-profile-header">{profile.avatar_url ? <img className="public-avatar" src={profile.avatar_url} alt="" /> : <div className="avatar avatar-plum avatar-large">{profile.display_name.slice(0, 2).toUpperCase()}</div>}<div><h1>{profile.display_name}</h1><p>@{profile.username}</p>{profile.bio && <span>{profile.bio}</span>}{profile.profile_links.length ? <div className="profile-link-list">{profile.profile_links.map((link) => { const hostname = new URL(link).hostname.replace(/^www\./, ""); return <a key={link} className="profile-link" href={link} target="_blank" rel="noreferrer noopener">{hostname}</a>; })}</div> : null}</div>{user?.id !== profile.id ? <button className="primary-button" onClick={() => void toggleProfileFollow()} disabled={loadingFollow}>{loadingFollow ? "Updating..." : isFollowing ? "Following" : "Follow"}</button> : null}</div><FollowDirectory user={user} profileId={profile.id} counts={followCounts} onAuthor={onAuthor} /><div className="section-heading"><div><span className="section-kicker">Published stories</span><h2>From {profile.display_name}</h2></div></div>{stories.length ? <div className="story-list">{stories.map((story) => <StoryCard key={story.id} story={story} liked={false} saved={false} following={isFollowing} onLike={() => {}} onSave={() => {}} onFollow={() => void toggleProfileFollow()} onRead={() => onRead(story)} onAuthor={() => {}} />)}</div> : <p className="subtitle">No public stories yet.</p>}</section>;
}

function NotificationPanel({ user }: { user: User | null }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        setItems([]);
        setLoadError("");
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError("");
      const { data: events, error: eventsError } = await supabase
        .from("activity_events")
        .select("id,event_type,actor_id,story_id,detail,created_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (eventsError) {
        if (active) {
          setLoadError(`Could not load notifications: ${eventsError.message}`);
          setLoading(false);
        }
        console.error("Could not load recent notifications.", eventsError);
        return;
      }

      const rows = (events ?? []) as {
        id: string;
        event_type: NotificationItem["kind"];
        actor_id: string;
        story_id: string | null;
        detail: string | null;
        created_at: string;
      }[];
      const actorIds = [...new Set(rows.map((event) => event.actor_id))];
      const storyIds = [...new Set(rows.flatMap((event) => event.story_id ? [event.story_id] : []))];
      const [profilesResult, storiesResult] = await Promise.all([
        actorIds.length
          ? supabase.from("profiles").select("id,display_name,avatar_url").in("id", actorIds)
          : Promise.resolve({ data: [], error: null }),
        storyIds.length
          ? supabase.from("stories").select("id,title").in("id", storyIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      const loadFailure = profilesResult.error ?? storiesResult.error;
      if (loadFailure) {
        if (active) {
          setLoadError(`Could not load notifications: ${loadFailure.message}`);
          setLoading(false);
        }
        console.error("Could not load notification details.", loadFailure);
        return;
      }
      const profileById = new Map<string, { id: string; display_name: string; avatar_url: string | null }>(
        (profilesResult.data ?? []).map((profile: { id: string; display_name: string; avatar_url: string | null }) => [profile.id, profile]),
      );
      const titleById = new Map<string, string>(
        (storiesResult.data ?? []).map((story: { id: string; title: string }) => [story.id, story.title]),
      );
      if (active) {
        setItems(rows.flatMap((event) => {
          const actor = profileById.get(event.actor_id);
          if (!actor) return [];
          const storyTitle = event.story_id ? titleById.get(event.story_id) : undefined;
          const comment = event.detail?.trim();
          return [{
            id: event.id,
            kind: event.event_type,
            actor: actor.display_name,
            actorAvatar: actor.avatar_url,
            storyTitle,
            detail: comment
              ? comment.length > 140 ? `${comment.slice(0, 137)}...` : comment
              : undefined,
            createdAt: event.created_at,
          }];
        }));
        setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [user]);

  const descriptions: Record<NotificationItem["kind"], string> = {
    like: "liked your story",
    favorite: "favorited your story",
    comment: "commented on your story",
    follow: "started following you",
  };

  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <strong>Recent activity</strong>
        <span>{items.length} / 50</span>
      </div>
      {loading ? (
        <p className="notification-empty">Loading activity...</p>
      ) : !user ? (
        <p className="notification-empty">Sign in to see activity.</p>
      ) : loadError ? (
        <p className="notification-empty">{loadError}</p>
      ) : !items.length ? (
        <p className="notification-empty">No recent likes, comments, favorites, or follows.</p>
      ) : (
        <div className="notification-list">
          {items.map((item) => (
            <div className="notification-item" key={item.id}>
              <span className="notification-avatar">
                {item.actorAvatar ? <img src={item.actorAvatar} alt="" /> : item.actor.slice(0, 2).toUpperCase()}
              </span>
              <p>
                <strong>{item.actor}</strong> {descriptions[item.kind]}
                {item.storyTitle && <> <em>{item.storyTitle}</em></>}
                {item.detail && <span className="notification-detail">“{item.detail}”</span>}
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type AdminUser = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

function SiteSettingsPanel() {
  const [siteImageUrl, setSiteImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin").then((response) => response.json()).then((body: { settings?: { site_image_url?: string | null } }) => setSiteImageUrl(body.settings?.site_image_url ?? ""));
  }, []);

  const save = async () => {
    setSaving(true);
    const response = await fetch("/api/admin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "settings", site_image_url: siteImageUrl }) });
    const body = await response.json();
    setSaving(false);
    setMessage(response.ok ? "Saved" : body.error ?? "Could not save");
  };

  return <section className="content-wrap admin-settings-wrap"><div className="analytics-card admin-site-settings"><span className="section-kicker">Website image</span><h2>Site picture</h2><div className="admin-site-preview">{siteImageUrl ? <img src={siteImageUrl} alt="" /> : <Coffee size={22} />}</div><label className="admin-settings-label">Image URL<input value={siteImageUrl} onChange={(event) => setSiteImageUrl(event.target.value)} placeholder="https://..." /></label><div className="admin-settings-actions"><button className="primary-button" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save site picture"}</button>{message && <small>{message}</small>}</div></div></section>;
}

function AdminPanel() {
  return <><SiteSettingsPanel /><AdminUserPanel /><PinningPanel /></>;
}

function AdminUserPanel() {
  const [data, setData] = useState<{ users: AdminUser[]; stories: Array<{ id: string; title: string; status: string; visibility: string; author_id: string; created_at: string; profiles?: { id: string } | { id: string }[] | null }> } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!data) return;
    if (!selectedUserId && data.users[0]) setSelectedUserId(data.users[0].id);
    if (selectedUserId) {
      const person = data.users.find((user) => user.id === selectedUserId) ?? null;
      setEditingUser(person ? { ...person, bio: person.bio ?? "", avatar_url: person.avatar_url ?? null } : null);
    }
  }, [data, selectedUserId]);

  const load = async () => { const response = await fetch("/api/admin"); const body = await response.json(); if (!response.ok) setError(body.error ?? "Could not load admin data"); else setData(body); };

  const updateUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    const response = await fetch("/api/admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingUser.id,
        username: editingUser.username,
        display_name: editingUser.display_name,
        bio: editingUser.bio,
        avatar_url: editingUser.avatar_url,
      }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "Update failed");
      return;
    }
    await load();
    setError("");
  };

  const remove = async (type: "story" | "profile", id: string, label: string) => { if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return; const response = await fetch("/api/admin", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) }); const body = await response.json(); if (!response.ok) setError(body.error ?? "Delete failed"); else await load(); };

  const selectedStories = data?.stories.filter((story) => {
    const relatedProfile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
    return story.author_id === selectedUserId || relatedProfile?.id === selectedUserId;
  }) ?? [];

  return <section className="content-wrap admin-wrap"><p className="eyebrow"><BarChart3 size={14} /> Private admin</p><h1>Manage the <em>reading room.</em></h1><p className="subtitle">Users and all stories, including private ones, are visible only to the approved admin account.</p>{error ? <p className="profile-error">{error}. Add SUPABASE_SERVICE_ROLE_KEY to Vercel if needed.</p> : !data ? <p className="subtitle">Loading admin data...</p> : <div className="admin-grid"><div className="analytics-card"><span className="section-kicker">People</span><h2>{data.users.length} users</h2><div className="admin-user-list">{data.users.map((person) => <button type="button" className={`admin-user-card ${selectedUserId === person.id ? "selected" : ""}`} key={person.id} onClick={() => setSelectedUserId(person.id)}><span className="avatar avatar-plum">{person.display_name.slice(0, 2).toUpperCase()}</span><span><strong>{person.display_name}</strong><small>@{person.username}</small></span><span className="admin-user-meta">Joined {new Date(person.created_at).toLocaleDateString()}</span></button>)}</div></div><div className="analytics-card admin-editor-panel">{editingUser ? <><span className="section-kicker">Profile editor</span><h2>{editingUser.display_name}</h2><div className="admin-editor-form"><div className="admin-avatar-preview">{editingUser.avatar_url ? <img src={editingUser.avatar_url} alt="" /> : <span>{editingUser.display_name.slice(0, 2).toUpperCase()}</span>}</div><label>Display name<input value={editingUser.display_name} onChange={(event) => setEditingUser({ ...editingUser, display_name: event.target.value })} /></label><label>Username<input value={editingUser.username} onChange={(event) => setEditingUser({ ...editingUser, username: event.target.value.replace(/[^a-zA-Z0-9_]/g, "") })} /></label><label>Avatar URL<input value={editingUser.avatar_url ?? ""} onChange={(event) => setEditingUser({ ...editingUser, avatar_url: event.target.value || null })} placeholder="https://..." /></label><label>Bio<textarea value={editingUser.bio ?? ""} onChange={(event) => setEditingUser({ ...editingUser, bio: event.target.value })} /></label><div className="admin-editor-actions"><button className="delete-button" onClick={() => remove("profile", editingUser.id, editingUser.display_name)}><X size={14} /> Delete user</button><button className="primary-button" onClick={() => void updateUser()} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div></div><div className="admin-story-panel"><span className="section-kicker">Stories</span><div className="admin-story-scroll">{selectedStories.length ? selectedStories.map((story) => <div className="admin-story-item" key={story.id}><div><strong>{story.title}</strong><small>{story.visibility} · {story.status}</small></div><button className="delete-button" onClick={() => remove("story", story.id, story.title)}><X size={14} /></button></div>) : <p className="subtitle">No stories for this user yet.</p>}</div></div></> : <p className="subtitle">Select a user to edit.</p>}</div></div>}</section>;
}

function PinningPanel() {
  const [stories, setStories] = useState<Array<{ id: string; title: string; status: string; visibility: string; is_pinned: boolean; pin_label: string | null }>>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch("/api/admin");
    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Could not load pinned stories");
    else setStories(body.stories ?? []);
  };

  useEffect(() => { void load(); }, []);

  const togglePin = async (story: { id: string; title: string; is_pinned: boolean; pin_label: string | null }) => {
    const pinLabel = story.is_pinned ? null : window.prompt("What label should appear on Discover?", story.pin_label ?? "Pinned");
    if (!story.is_pinned && pinLabel === null) return;
    setSavingId(story.id);
    setError("");
    setMessage("");
    const nextPinned = !story.is_pinned;
    const response = await fetch("/api/admin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "pin-story", id: story.id, is_pinned: nextPinned, pin_label: pinLabel }) });
    const body = await response.json();
    setSavingId(null);
    if (!response.ok) {
      setError(body.error ?? "Pin update failed");
      return;
    }
    setStories((current) => current.map((item) => item.id === story.id ? { ...item, is_pinned: nextPinned, pin_label: nextPinned ? pinLabel?.trim().slice(0, 40) || "Pinned" : null } : item));
    setMessage(nextPinned ? `Pinned “${story.title}” as “${pinLabel?.trim().slice(0, 40) || "Pinned"}”.` : `Unpinned “${story.title}”.`);
  };

  return <section className="content-wrap admin-settings-wrap"><div className="analytics-card admin-pinning-panel"><span className="section-kicker">Pinned stories</span><h2>Choose stories for the front of Discover</h2>{error ? <p className="profile-error">{error}</p> : message ? <p className="admin-success">{message}</p> : null}<div className="admin-story-scroll">{stories.length ? stories.map((story) => <div className="admin-story-item" key={story.id}><div><strong>{story.title}</strong><small>{story.visibility} · {story.status}{story.is_pinned && story.pin_label ? ` · ${story.pin_label}` : ""}</small></div><button type="button" className={`quiet-button ${story.is_pinned ? "selected" : ""}`} onClick={() => void togglePin(story)} disabled={savingId === story.id} aria-label={story.is_pinned ? "Unpin story" : "Pin story"} title={story.is_pinned ? "Unpin story" : "Pin story"}><Pin size={14} /></button></div>) : <p className="subtitle">No stories yet.</p>}</div></div></section>;
}

function ShelfView({
  user,
  discoverStories,
  saved,
  liked,
  following,
  onLike,
  onSave,
  onFollow,
  onRead,
  onAuthor,
  onWrite,
  onEdit,
  onDelete,
}: {
  user: User | null;
  discoverStories: Story[];
  saved: string[];
  liked: string[];
  following: string[];
  onLike: (story: Story) => void;
  onSave: (story: Story) => void;
  onFollow: (story: Story) => void;
  onRead: (story: Story) => void;
  onAuthor: (username: string) => void;
  onWrite: () => void;
  onEdit: (storyId: string) => void;
  onDelete: (storyId: string) => void;
}) {
  const [authoredStories, setAuthoredStories] = useState<Array<{ id: string; title: string; excerpt: string | null; status: string; visibility: string; updated_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("stories").select("id,title,excerpt,status,visibility,updated_at").eq("author_id", user.id).order("updated_at", { ascending: false });
      if (active) { setAuthoredStories(data ?? []); setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [user]);
  if (!user) return <section className="content-wrap empty-feed"><p className="eyebrow"><Bookmark size={14} /> Your shelf</p><h1>Sign in to keep your <em>stories.</em></h1><p className="subtitle">Your drafts, published stories, and edits will live here.</p></section>;
  const savedStories = discoverStories.filter((story) => saved.includes(story.id));
  return (
    <section className="content-wrap shelf-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow"><Bookmark size={14} /> Your library</p>
          <h1>Your <em>stories.</em></h1>
          <p className="subtitle">Stories you&apos;ve written and stories you&apos;ve saved.</p>
        </div>
        <button className="primary-button" onClick={onWrite}><PenLine size={17} /> New story</button>
      </div>

      <section className="shelf-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Made by you</span>
            <h2>Your stories</h2>
          </div>
          {!loading && <span className="shelf-section-count">{authoredStories.length}</span>}
        </div>
        {loading ? (
          <p className="subtitle">Loading your stories...</p>
        ) : authoredStories.length ? (
          <div className="shelf-list">
            {authoredStories.map((story) => (
              <article className="shelf-row" key={story.id}>
                <div className="shelf-row-copy">
                  <div className="story-card-meta">
                    <span className={`status-pill status-${story.status}`}>{story.status}</span>
                    <span>{story.visibility}</span>
                  </div>
                  <h2>{story.title}</h2>
                  <p>{story.excerpt || "No excerpt yet."}</p>
                  <small>Updated {new Date(story.updated_at).toLocaleDateString()}</small>
                </div>
                <div className="shelf-row-actions">
                  <button className="quiet-button" onClick={() => onEdit(story.id)}><PenLine size={15} /> Edit</button>
                  <button className="delete-button" onClick={() => { if (window.confirm(`Delete “${story.title}”?`)) onDelete(story.id); }}><X size={15} /> Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="shelf-empty">
            <BookOpen size={24} />
            <h2>You haven&apos;t made any stories yet.</h2>
            <p>Start with a page and make it yours.</p>
            <button className="text-button" onClick={onWrite}>Write your first story <ChevronRight size={15} /></button>
          </div>
        )}
      </section>

      <section className="shelf-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">From Discover</span>
            <h2>Saved stories</h2>
          </div>
          <span className="shelf-section-count">{savedStories.length}</span>
        </div>
        {savedStories.length ? (
          <div className="story-list">
            {savedStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                liked={liked.includes(story.id)}
                saved={saved.includes(story.id)}
                following={following.includes(story.authorId)}
                onLike={() => onLike(story)}
                onSave={() => onSave(story)}
                onFollow={() => onFollow(story)}
                onRead={() => onRead(story)}
                onAuthor={() => onAuthor(story.handle)}
              />
            ))}
          </div>
        ) : (
          <div className="shelf-empty">
            <Bookmark size={24} />
            <h2>No saved stories yet.</h2>
            <p>Favorite stories in Discover and they&apos;ll appear here.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function LegacyDashboard({ onWrite }: { onWrite: () => void }) {
  return (
    <section className="content-wrap dashboard-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <BarChart3 size={14} /> Your overview
          </p>
          <h1>
            Good morning, <em>Nora.</em>
          </h1>
          <p className="subtitle">
            Here&apos;s how your stories are finding their people.
          </p>
        </div>
        <button className="primary-button" onClick={onWrite}>
          <PenLine size={17} /> New story
        </button>
      </div>
      <div className="stat-grid">
        <StatCard
          label="Total views"
          value="12,840"
          change="+18.4%"
          icon={<BookOpen size={17} />}
        />
        <StatCard
          label="Likes"
          value="1,286"
          change="+12.8%"
          icon={<Heart size={17} />}
        />
        <StatCard
          label="Favorites"
          value="438"
          change="+9.2%"
          icon={<Bookmark size={17} />}
        />
        <StatCard
          label="Shares"
          value="196"
          change="+24.6%"
          icon={<Share2 size={17} />}
        />
      </div>
      <div className="analytics-grid">
        <div className="analytics-card chart-card">
          <div className="analytics-header">
            <div>
              <span className="section-kicker">Audience pulse</span>
              <h2>People are reading</h2>
            </div>
            <select defaultValue="Last 30 days">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
            </select>
          </div>
          <div className="chart-total">
            <strong>12,840</strong>
            <span>
              <span className="up-dot">↗</span> 18.4%{" "}
              <small>vs. last month</small>
            </span>
          </div>
          <div className="bar-chart">
            {chartData.map((height, index) => (
              <div className="bar-column" key={index}>
                <div className="bar" style={{ height: `${height}%` }} />
                <span>
                  {
                    [
                      "Aug 22",
                      "",
                      "",
                      "Aug 29",
                      "",
                      "",
                      "Sep 5",
                      "",
                      "",
                      "Sep 12",
                      "",
                      "Sep 19",
                    ][index]
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="analytics-card audience-card">
          <div className="analytics-header">
            <div>
              <span className="section-kicker">Your stories</span>
              <h2>Top performers</h2>
            </div>
            <button className="icon-button">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="performance-list">
            <div>
              <span className="rank">01</span>
              <span className="mini-art mini-sage">
                <BookOpen size={14} />
              </span>
              <span>
                <strong>The last table by the window</strong>
                <small>8,420 views</small>
              </span>
              <span className="performance-change">+32%</span>
            </div>
            <div>
              <span className="rank">02</span>
              <span className="mini-art mini-terracotta">
                <BookOpen size={14} />
              </span>
              <span>
                <strong>Things I learned from rain</strong>
                <small>2,918 views</small>
              </span>
              <span className="performance-change">+18%</span>
            </div>
            <div>
              <span className="rank">03</span>
              <span className="mini-art mini-mustard">
                <BookOpen size={14} />
              </span>
              <span>
                <strong>A note to my younger self</strong>
                <small>1,502 views</small>
              </span>
              <span className="performance-change">+9%</span>
            </div>
          </div>
          <button className="text-button full-button">
            View all stories <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="dashboard-bottom">
        <div className="recent-heading">
          <h2>Recent activity</h2>
          <button className="text-button">
            See all <ChevronRight size={15} />
          </button>
        </div>
        <div className="activity-row">
          <div className="avatar avatar-rose">JR</div>
          <p>
            <strong>Jules Rowan</strong> saved{" "}
            <em>The last table by the window</em>
          </p>
          <span>2h ago</span>
        </div>
        <div className="activity-row">
          <div className="avatar avatar-ochre">TB</div>
          <p>
            <strong>Theo Bell</strong> started following you
          </p>
          <span>5h ago</span>
        </div>
      </div>
    </section>
  );
}

type DashboardStats = {
  views: number;
  likes: number;
  favorites: number;
  shares: number;
  stories: { id: string; title: string; created_at: string }[];
  viewsByDay: number[];
  likesByDay: number[];
  favoritesByDay: number[];
  sharesByDay: number[];
};

function Dashboard({
  onWrite,
  user,
}: {
  onWrite: () => void;
  user: User | null;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      if (!user) {
        setStats(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: storyRows } = await supabase
        .from("stories")
        .select("id,title,created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
      const authoredStories = storyRows ?? [];
      const storyIds = authoredStories.map((story: { id: string }) => story.id);
      if (storyIds.length === 0) {
        if (active) {
          setStats({
            views: 0,
            likes: 0,
            favorites: 0,
            shares: 0,
            stories: [],
            viewsByDay: Array(12).fill(0),
            likesByDay: Array(12).fill(0),
            favoritesByDay: Array(12).fill(0),
            sharesByDay: Array(12).fill(0),
          });
          setLoading(false);
        }
        return;
      }

      const buildSeries = (rows: Array<{ created_at: string }> | null) => {
        const series = Array(12).fill(0) as number[];
        (rows ?? []).forEach((row) => {
          const day = Math.floor(
            (Date.now() - new Date(row.created_at).getTime()) / 86400000,
          );
          if (day >= 0 && day < 12) series[11 - day] += 1;
        });
        return series;
      };

      const countFor = async (
        table: "story_views" | "likes" | "favorites" | "story_shares",
      ) => {
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .in("story_id", storyIds);
        return count ?? 0;
      };

      const [
        { count: views },
        likes,
        favorites,
        shares,
        { data: viewRows },
        { data: likeRows },
        { data: favoriteRows },
        { data: shareRows },
      ] = await Promise.all([
        supabase
          .from("story_views")
          .select("id", { count: "exact", head: true })
          .in("story_id", storyIds),
        countFor("likes"),
        countFor("favorites"),
        countFor("story_shares"),
        supabase
          .from("story_views")
          .select("created_at")
          .in("story_id", storyIds)
          .gte(
            "created_at",
            new Date(Date.now() - 11 * 86400000).toISOString(),
          ),
        supabase
          .from("likes")
          .select("created_at")
          .in("story_id", storyIds)
          .gte(
            "created_at",
            new Date(Date.now() - 11 * 86400000).toISOString(),
          ),
        supabase
          .from("favorites")
          .select("created_at")
          .in("story_id", storyIds)
          .gte(
            "created_at",
            new Date(Date.now() - 11 * 86400000).toISOString(),
          ),
        supabase
          .from("story_shares")
          .select("created_at")
          .in("story_id", storyIds)
          .gte(
            "created_at",
            new Date(Date.now() - 11 * 86400000).toISOString(),
          ),
      ]);

      if (active) {
        setStats({
          views: views ?? 0,
          likes,
          favorites,
          shares,
          stories: authoredStories,
          viewsByDay: buildSeries(viewRows ?? []),
          likesByDay: buildSeries(likeRows ?? []),
          favoritesByDay: buildSeries(favoriteRows ?? []),
          sharesByDay: buildSeries(shareRows ?? []),
        });
        setLoading(false);
      }
    };
    void loadStats();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user)
    return (
      <section className="content-wrap dashboard-wrap">
        <div className="empty-dashboard">
          <BarChart3 size={28} />
          <p className="eyebrow">Your overview</p>
          <h1>
            Sign in to see <em>your numbers.</em>
          </h1>
          <p className="subtitle">
            Publish a story and Flip Stories will track its real reach here.
          </p>
        </div>
      </section>
    );
  if (loading)
    return (
      <section className="content-wrap dashboard-wrap">
        <div className="empty-dashboard">
          <BarChart3 size={28} />
          <h1>
            Loading your <em>library.</em>
          </h1>
          <p className="subtitle">
            Gathering the latest activity from Supabase.
          </p>
        </div>
      </section>
    );
  const maxViews = Math.max(...(stats?.viewsByDay ?? [0]), 1);
  const metricCharts = [
    {
      title: "Views",
      total: stats?.views ?? 0,
      data: stats?.viewsByDay ?? Array(12).fill(0),
      color: "sage",
    },
    {
      title: "Likes",
      total: stats?.likes ?? 0,
      data: stats?.likesByDay ?? Array(12).fill(0),
      color: "terracotta",
    },
    {
      title: "Favorites",
      total: stats?.favorites ?? 0,
      data: stats?.favoritesByDay ?? Array(12).fill(0),
      color: "mustard",
    },
    {
      title: "Shares",
      total: stats?.shares ?? 0,
      data: stats?.sharesByDay ?? Array(12).fill(0),
      color: "plum",
    },
  ];

  return (
    <section className="content-wrap dashboard-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <BarChart3 size={14} /> Your overview
          </p>
          <h1>
            Your real <em>numbers.</em>
          </h1>
          <p className="subtitle">
            Only activity from your published stories appears here.
          </p>
        </div>
        <button className="primary-button" onClick={onWrite}>
          <PenLine size={17} /> New story
        </button>
      </div>
      <div className="stat-grid">
        <RealStatCard
          label="Total views"
          value={stats?.views ?? 0}
          icon={<BookOpen size={17} />}
        />
        <RealStatCard
          label="Likes"
          value={stats?.likes ?? 0}
          icon={<Heart size={17} />}
        />
        <RealStatCard
          label="Favorites"
          value={stats?.favorites ?? 0}
          icon={<Bookmark size={17} />}
        />
        <RealStatCard
          label="Shares"
          value={stats?.shares ?? 0}
          icon={<Share2 size={17} />}
        />
      </div>
      <div className="analytics-grid metric-grid">
        {metricCharts.map((metric) => (
          <MetricChartCard
            key={metric.title}
            title={metric.title}
            total={metric.total}
            data={metric.data}
            color={metric.color as "sage" | "terracotta" | "mustard" | "plum"}
          />
        ))}
      </div>
      <div className="analytics-grid" style={{ marginTop: "20px" }}>
        <div className="analytics-card chart-card">
          <div className="analytics-header">
            <div>
              <span className="section-kicker">Last 12 days</span>
              <h2>Story views</h2>
            </div>
          </div>
          <div className="chart-total">
            <strong>{stats?.views ?? 0}</strong>
            <span>
              real views <small>from your stories</small>
            </span>
          </div>
          <div className="bar-chart">
            {(stats?.viewsByDay ?? []).map((value, index) => (
              <div className="bar-column" key={index}>
                <div
                  className="bar"
                  style={{
                    height: `${Math.max((value / maxViews) * 100, value ? 5 : 2)}%`,
                  }}
                />
                <span>
                  {index === 0
                    ? "12d ago"
                    : index === 6
                      ? "6d ago"
                      : index === 11
                        ? "Today"
                        : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="analytics-card audience-card">
          <div className="analytics-header">
            <div>
              <span className="section-kicker">Your library</span>
              <h2>Recent stories</h2>
            </div>
          </div>
          {stats?.stories.length ? (
            <div className="performance-list">
              {stats.stories.slice(0, 3).map((story, index) => (
                <div key={story.id}>
                  <span className="rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mini-art mini-sage">
                    <BookOpen size={14} />
                  </span>
                  <span>
                    <strong>{story.title}</strong>
                    <small>
                      {new Date(story.created_at).toLocaleDateString()}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty-copy">
              You have not published a story yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricChartCard({
  title,
  total,
  data,
  color,
}: {
  title: string;
  total: number;
  data: number[];
  color: "sage" | "terracotta" | "mustard" | "plum";
}) {
  const height = Math.max(...data, 1);

  return (
    <div className="analytics-card metric-card">
      <div className="analytics-header metric-header">
        <div>
          <span className="section-kicker">Activity</span>
          <h2>{title}</h2>
        </div>
        <strong>{total.toLocaleString()}</strong>
      </div>
      <div className="mini-chart">
        {data.map((value, index) => (
          <div className="mini-chart-column" key={`${title}-${index}`}>
            <div
              className={`mini-chart-bar mini-chart-${color}`}
              style={{
                height: `${Math.max((value / height) * 100, value ? 8 : 2)}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mini-chart-labels">
        {data.map((_, index) => (
          <span key={`${title}-label-${index}`}>
            {index === 0 ? "12d" : index === 6 ? "6d" : index === 11 ? "Now" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function RealStatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      <small className="stat-source">From your stories</small>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>
        <span>↗</span> {change} <em>this month</em>
      </small>
    </div>
  );
}

function Writer({
  setView,
  user,
  storyTitle,
  setStoryTitle,
  storyDescription,
  setStoryDescription,
  selectedGenres,
  setSelectedGenres,
  storyVisibility,
  setStoryVisibility,
  pages,
  activePage,
  setActivePage,
  updatePage,
  addPage,
  deletePage,
  notify,
  onPublish,
  editing,
}: {
  setView: (view: string) => void;
  user: User | null;
  storyTitle: string;
  setStoryTitle: (value: string) => void;
  storyDescription: string;
  setStoryDescription: (value: string) => void;
  selectedGenres: string[];
  setSelectedGenres: (genres: string[]) => void;
  storyVisibility: "public" | "followers" | "private";
  setStoryVisibility: (value: "public" | "followers" | "private") => void;
  pages: string[];
  activePage: number;
  setActivePage: (page: number) => void;
  updatePage: (value: string) => void;
  addPage: () => void;
  deletePage: () => void;
  notify: (message: string) => void;
  onPublish: () => Promise<void>;
  editing: boolean;
}) {
  const storyEditorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [genreMenuOpen, setGenreMenuOpen] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Libre Baskerville");
  const [storyCharacterCount, setStoryCharacterCount] = useState(0);
  const rememberSelection = () => {
    const editor = storyEditorRef.current;
    const selection = window.getSelection();
    if (editor && selection?.rangeCount && editor.contains(selection.anchorNode)) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };
  const applyFont = (font: string) => {
    const editor = storyEditorRef.current;
    const selection = window.getSelection();
    const range = savedRangeRef.current;
    if (!editor || !range || !editor.contains(range.commonAncestorContainer) || range.collapsed) {
      notify("Select text in your story first to change its font.");
      return;
    }

    loadStoryFont(font);
    const startRange = document.createRange();
    startRange.selectNodeContents(editor);
    startRange.setEnd(range.startContainer, range.startOffset);
    const endRange = document.createRange();
    endRange.selectNodeContents(editor);
    endRange.setEnd(range.endContainer, range.endOffset);
    const selectionStart = startRange.toString().length;
    const selectionEnd = endRange.toString().length;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const selectedNodes: Array<{ node: Text; start: number; end: number }> = [];
    let textNode = walker.nextNode() as Text | null;
    let textOffset = 0;
    while (textNode) {
      const nodeStart = Math.max(0, selectionStart - textOffset);
      const nodeEnd = Math.min(textNode.length, selectionEnd - textOffset);
      if (nodeStart < nodeEnd) selectedNodes.push({ node: textNode, start: nodeStart, end: nodeEnd });
      textOffset += textNode.length;
      textNode = walker.nextNode() as Text | null;
    }
    if (!selectedNodes.length) {
      notify("Select some story text before changing its font.");
      return;
    }

    const fontSpans: HTMLSpanElement[] = [];
    selectedNodes.slice().reverse().forEach(({ node, start, end }) => {
      const selectedText = start ? node.splitText(start) : node;
      if (end - start < selectedText.length) selectedText.splitText(end - start);
      const fontSpan = document.createElement("span");
      fontSpan.style.fontFamily = `"${font}"`;
      selectedText.replaceWith(fontSpan);
      fontSpan.append(selectedText);
      fontSpans.unshift(fontSpan);
    });
    const fontRange = document.createRange();
    const firstText = fontSpans[0].firstChild;
    const lastText = fontSpans[fontSpans.length - 1].firstChild;
    if (!firstText || !lastText) return;
    fontRange.setStart(firstText, 0);
    fontRange.setEnd(lastText, lastText.textContent?.length ?? 0);
    selection?.removeAllRanges();
    selection?.addRange(fontRange);
    savedRangeRef.current = fontRange.cloneRange();
    updatePage(sanitizeStoryMarkup(editor.innerHTML));
  };
  const applyInlineFormat = (command: "bold" | "italic") => {
    const editor = storyEditorRef.current;
    const range = savedRangeRef.current;
    if (!editor || !range || !editor.contains(range.commonAncestorContainer) || range.collapsed) {
      notify("Select text in your story first to format it.");
      return;
    }
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    editor.focus();
    document.execCommand(command);
    rememberSelection();
    updatePage(sanitizeStoryMarkup(editor.innerHTML));
  };
  const applyQuotationMarks = () => {
    const editor = storyEditorRef.current;
    const selection = window.getSelection();
    if (!editor) return;

    let range = savedRangeRef.current;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    const hasSelection = !range.collapsed;
    const quotedContent = range.extractContents();
    const quotedText = document.createElement("span");
    const openingQuote = document.createTextNode("“");
    quotedText.append(openingQuote, quotedContent, document.createTextNode("”"));
    range.insertNode(quotedText);

    const quoteRange = document.createRange();
    if (hasSelection) {
      quoteRange.selectNodeContents(quotedText);
    } else {
      quoteRange.setStart(openingQuote, openingQuote.length);
      quoteRange.collapse(true);
    }
    editor.focus();
    selection?.removeAllRanges();
    selection?.addRange(quoteRange);
    savedRangeRef.current = quoteRange.cloneRange();
    updatePage(sanitizeStoryMarkup(editor.innerHTML));
    setStoryCharacterCount(editor.innerText.length);
  };
  useEffect(() => {
    const editor = storyEditorRef.current;
    if (editor) {
      editor.innerHTML = prepareStoryEditorContent(pages[activePage] ?? "");
      setStoryCharacterCount(editor.innerText.length);
    }
    savedRangeRef.current = null;
  }, [activePage]);
  return (
    <section className="content-wrap writer-wrap">
      <div className="writer-heading">
        <div>
          <p className="eyebrow">
            <PenLine size={14} /> Your writing desk
          </p>
          <h1>
            Make a little <em>room.</em>
          </h1>
          <p className="subtitle">
            Stories don&apos;t have to be loud to stay with someone.
          </p>
        </div>
        <button className="quiet-button" onClick={() => setView("Discover")}>
          <X size={16} /> Close
        </button>
      </div>
      <div className="writer-layout">
        <div className="paper-card">
          <div className="paper-topline">
            <span>{editing ? "Editing story" : "New story"}</span>
            <span>
              Saved just now <Check size={14} />
            </span>
          </div>
          <input
            className="title-input"
            value={storyTitle}
            onChange={(event) => setStoryTitle(event.target.value)}
            placeholder="Give your story a title..."
          />
          <label className="description-field">
            Story description
            <textarea
              value={storyDescription}
              onChange={(event) => setStoryDescription(event.target.value)}
              maxLength={240}
              placeholder="Give readers a short reason to open this story..."
            />
            <span>{storyDescription.length} / 240</span>
          </label>
          <div className="writing-tools">
            <label className="font-picker">
              <span className="sr-only">Font family</span>
              <select title="Select story text, then choose its font" value={selectedFont} onMouseDown={rememberSelection} onChange={(event) => {
                const font = event.target.value;
                setSelectedFont(font);
                applyFont(font);
              }}>
                <optgroup label="Sans serif">
                  {STORY_FONTS.slice(0, 9).map((font) => <option key={font} value={font}>{font}</option>)}
                  {STORY_FONTS.slice(13, 14).map((font) => <option key={font} value={font}>{font}</option>)}
                  {STORY_FONTS.slice(21, 38).map((font) => <option key={font} value={font}>{font}</option>)}
                </optgroup>
                <optgroup label="Serif and display">
                  {STORY_FONTS.slice(9, 13).map((font) => <option key={font} value={font}>{font}</option>)}
                  {STORY_FONTS.slice(14, 21).map((font) => <option key={font} value={font}>{font}</option>)}
                  {STORY_FONTS.slice(38).map((font) => <option key={font} value={font}>{font}</option>)}
                </optgroup>
              </select>
            </label>
            <button type="button" className="quote-tool" aria-label="Add curly quotation marks" title="Wrap selected text or insert quotes at the cursor" onMouseDown={rememberSelection} onClick={applyQuotationMarks}>
              “ ”
            </button>
            <button type="button" aria-label="Bold" title="Bold" onMouseDown={rememberSelection} onClick={() => applyInlineFormat("bold")}>
              <span className="tool-bold">B</span>
            </button>
            <button type="button" aria-label="Italic" title="Italic" onMouseDown={rememberSelection} onClick={() => applyInlineFormat("italic")}>
              <span className="tool-italic">I</span>
            </button>
            <span />
            <button type="button" aria-label="Add a new page" onClick={addPage}>
              <Plus size={17} />
            </button>
            <button type="button" aria-label="More page actions" onClick={() => setPageMenuOpen((open) => !open)}>
              <MoreHorizontal size={18} />
            </button>
            {pageMenuOpen && (
              <div className="page-menu">
                <button onClick={() => { deletePage(); setPageMenuOpen(false); }}>
                  Delete page {activePage + 1}
                </button>
              </div>
            )}
          </div>
          <div
            ref={storyEditorRef}
            className="story-textarea story-rich-editor"
            contentEditable
            role="textbox"
            aria-label="Story text"
            aria-multiline="true"
            data-placeholder="Start with the moment you knew..."
            onMouseUp={rememberSelection}
            onKeyUp={rememberSelection}
            onInput={(event) => {
              const editor = event.currentTarget;
              if (editor.innerText.length > PAGE_LIMIT) {
                editor.innerHTML = prepareStoryEditorContent(pages[activePage] ?? "");
                notify(`Each page is limited to ${PAGE_LIMIT} characters.`);
                return;
              }
              setStoryCharacterCount(editor.innerText.length);
              updatePage(sanitizeStoryMarkup(editor.innerHTML));
              rememberSelection();
            }}
            onPaste={(event) => {
              event.preventDefault();
              const text = event.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
            }}
          />
          <div
            className={`page-limit ${storyCharacterCount >= PAGE_LIMIT ? "page-limit-full" : ""}`}
          >
            <span>
              {storyCharacterCount} / {PAGE_LIMIT}
            </span>
            {storyCharacterCount >= PAGE_LIMIT && <span>Page full</span>}
          </div>
          {storyCharacterCount >= PAGE_LIMIT && (
            <button className="new-page-prompt" onClick={addPage}>
              <Plus size={16} /> This page is full. Start a new page
            </button>
          )}
          <div className="paper-footer">
            <span>
              Page {activePage + 1} of {pages.length}
            </span>
            <div className="page-controls">
              <button className="add-page-button" onClick={addPage} aria-label="Add a new page">
                <Plus size={16} /> <span>Add page</span>
              </button>
              <button
                onClick={() => setActivePage(Math.max(0, activePage - 1))}
                disabled={activePage === 0}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setActivePage(Math.min(pages.length - 1, activePage + 1))
                }
                disabled={activePage === pages.length - 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        <aside className="writer-side-panel">
          <div className="side-panel-header">
            <span>Story details</span>
            <Sparkles size={16} />
          </div>
          <div className="genre-field">
            <span>Genres <small>Choose up to 3</small></span>
            <button className="genre-select" onClick={() => setGenreMenuOpen((open) => !open)} aria-expanded={genreMenuOpen}>
              <span>{selectedGenres.length ? selectedGenres.join(", ") : "Choose genres"}</span>
              <ChevronDown size={15} />
            </button>
            {genreMenuOpen && (
              <div className="genre-menu">
                {GENRES.map((genre) => {
                  const selected = selectedGenres.includes(genre);
                  const disabled = !selected && selectedGenres.length >= 3;
                  return (
                    <button
                      key={genre}
                      className={selected ? "selected" : ""}
                      disabled={disabled}
                      onClick={() => setSelectedGenres(selected ? selectedGenres.filter((item) => item !== genre) : [...selectedGenres, genre])}
                    >
                      <span>{selected ? "✓" : ""}</span> {genre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <label>
            Who can read this?
            <select value={storyVisibility} onChange={(event) => setStoryVisibility(event.target.value as "public" | "followers" | "private") }>
              <option value="public">Everyone</option>
              <option value="followers">Followers only</option>
              <option value="private">Only me</option>
            </select>
          </label>
          <div className="story-tip">
            <Coffee size={17} />
            <p>
              <strong>A tiny prompt</strong>
              <br />
              Write about a sound you haven&apos;t heard in years.
            </p>
            <button onClick={() => notify("Prompt saved to your desk")}>
              Save prompt
            </button>
          </div>
          <button
            className="publish-button"
            onClick={() => void onPublish()}
          >
            Publish story <Send size={16} />
          </button>
          <button
            className="draft-button"
            onClick={() => notify("Draft saved")}
          >
            Save as draft
          </button>
        </aside>
      </div>
    </section>
  );
}

function FormattedStoryText({ text }: { text: string }) {
  const [richContent, setRichContent] = useState<React.ReactNode[] | null>(null);
  useEffect(() => {
    if (!/<(?:div|p|span|strong|b|em|i|br)\b/i.test(text)) {
      setRichContent(null);
      return;
    }
    setRichContent(storyMarkupToReact(text));
  }, [text]);

  if (richContent) return <>{richContent}</>;
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  return <>{paragraphs.map((paragraph, paragraphIndex) => <p key={`${paragraphIndex}-${paragraph.slice(0, 12)}`}>{paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith("*") && part.endsWith("*") ? <em key={index}>{part.slice(1, -1)}</em> : <span key={index}>{part}</span>)}</p>)}</>;
}

function ReaderModal({
  story,
  user,
  liked,
  saved,
  following,
  onClose,
  onLike,
  onSave,
  onFollow,
  onAuthor,
  onShare,
  onViewError,
  setAuthMode,
  setAuthOpen,
}: {
  story: Story;
  user: User | null;
  liked: boolean;
  saved: boolean;
  following: boolean;
  onClose: () => void;
  onLike: () => void;
  onSave: () => void;
  onFollow: () => void;
  onAuthor: () => void;
  onShare: () => void;
  onViewError: (message: string) => void;
  setAuthMode: (mode: "login" | "signup") => void;
  setAuthOpen: (open: boolean) => void;
}) {
  const [pages, setPages] = useState<string[]>([story.excerpt]);
  const [pageIndex, setPageIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(0);
  const [postingComment, setPostingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const loadComments = async () => {
    setCommentsLoading(true);
    setCommentsError("");
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      supabase
        .from("story_comments")
        .select("id,content,rating,created_at,user_id,profiles!story_comments_user_id_fkey(display_name,username,avatar_url)")
        .eq("story_id", story.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("story_comments")
        .select("id", { count: "exact", head: true })
        .eq("story_id", story.id),
    ]);
    if (error || countError) {
      setCommentsError(error?.message ?? countError?.message ?? "Comments could not be loaded.");
      setCommentsLoading(false);
      return;
    }
    setComments((data ?? []).map((row: any) => {
      const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        content: row.content,
        rating: row.rating,
        createdAt: row.created_at,
        userId: row.user_id,
        author: author?.display_name || "Reader",
        username: author?.username || "",
        avatarUrl: author?.avatar_url ?? null,
      } satisfies StoryComment;
    }));
    setCommentCount(count ?? 0);
    setCommentsLoading(false);
  };

  useEffect(() => {
    let active = true;
    const loadCount = async () => {
      const { count, error } = await supabase
        .from("story_comments")
        .select("id", { count: "exact", head: true })
        .eq("story_id", story.id);
      if (!active) return;
      if (error) setCommentsError(error.message);
      else setCommentCount(count ?? 0);
    };
    void loadCount();
    return () => { active = false; };
  }, [story.id]);

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    const content = commentText.trim();
    if (!content) return;
    setPostingComment(true);
    setCommentsError("");
    const { error } = await supabase.from("story_comments").insert({
      story_id: story.id,
      user_id: user.id,
      content,
      rating: commentRating || null,
    });
    if (error) {
      setCommentsError(error.message);
      setPostingComment(false);
      return;
    }
    setCommentText("");
    setCommentRating(0);
    setPostingComment(false);
    await loadComments();
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from("story_comments").delete().eq("id", commentId);
    if (error) {
      setCommentsError(error.message);
      return;
    }
    setComments((current) => current.filter((comment) => comment.id !== commentId));
    setCommentCount((current) => Math.max(0, current - 1));
  };

  const toggleComments = () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (nextOpen && !comments.length && !commentsLoading) void loadComments();
  };
  useEffect(() => {
    let active = true;
    supabase.from("story_pages").select("page_number,content").eq("story_id", story.id).order("page_number", { ascending: true }).then(({ data }: { data: Array<{ page_number: number; content: string }> | null }) => {
      if (active && data?.length) { setPages(data.map((page: { content: string }) => page.content)); setPageIndex(0); }
    });
    return () => { active = false; };
  }, [story.id, story.excerpt]);
  useEffect(() => {
    supabase.from("story_views").insert({ story_id: story.id, user_id: user?.id ?? null }).then(({ error }: { error: { message: string } | null }) => {
      if (error) onViewError(error.message);
    });
  }, [story.id, user?.id]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <article
        className="reader-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close story"
        >
          <X size={19} />
        </button>
        <div className={`reader-art reader-art-${story.accent}`}>
          <div className="reader-art-circle" />
          <Coffee size={37} />
        </div>
        <div className="reader-content">
          <span className="story-category">{story.category}</span>
          <h2>{story.title}</h2>
          <div className="reader-author">
            <button type="button" className="author-chip reader-author-profile" onClick={onAuthor} aria-label={`Open ${story.author}'s profile`}>
              {story.avatarUrl ? <img className="avatar avatar-image" src={story.avatarUrl} alt="" /> : <span className={`avatar avatar-${story.accent}`}>{story.initials}</span>}
              <span>
                <strong>{story.author}</strong>
                <small>
                  {story.readTime} · {story.date}
                </small>
              </span>
            </button>
            <button onClick={onSave} className="reader-save">
              {saved ? "Saved" : "Save story"}{" "}
              <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
            </button>
            <button type="button" className={`follow-chip ${following ? "following" : ""}`} onClick={onFollow}>
              {following ? "Following" : "Follow"}
            </button>
          </div>
          <div className="reader-body">
            <FormattedStoryText text={pages[pageIndex] ?? ""} />
          </div>
          <div className="reader-pages"><button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0}><ChevronLeft size={16} /></button><span>Page {pageIndex + 1} of {pages.length}</span><button onClick={() => setPageIndex(Math.min(pages.length - 1, pageIndex + 1))} disabled={pageIndex === pages.length - 1}><ChevronRight size={16} /></button></div>
          <div className="reader-actions">
            <button onClick={onLike} className={liked ? "liked" : ""}>
              <Heart size={17} fill={liked ? "currentColor" : "none"} />{" "}
              {liked ? "Liked" : "Like story"}
            </button>
            <button type="button" onClick={toggleComments} aria-expanded={commentsOpen}>
              <MessageCircle size={16} /> Comments ({commentCount})
            </button>
            <button onClick={onShare}>
              <Share2 size={17} /> Share
            </button>
          </div>
          {commentsOpen && (
            <section className="story-comments" aria-label="Story comments">
              <div className="story-comments-heading">
                <div><span className="section-kicker">The conversation</span><h3>Comments</h3></div>
                <span>{commentCount} {commentCount === 1 ? "comment" : "comments"}</span>
              </div>
              <form className="story-comment-form" onSubmit={submitComment}>
                {user ? (
                  <>
                    <label htmlFor="story-comment-text">Add your thoughts</label>
                    <textarea
                      id="story-comment-text"
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      maxLength={1000}
                      required
                      placeholder="Share a thoughtful comment..."
                    />
                    <div className="comment-form-footer">
                      <div className="comment-rating">
                        <span>Rate this story <small>(optional)</small></span>
                        <div role="group" aria-label="Rate this story from 1 to 5 stars">
                          {Array.from({ length: 5 }, (_, index) => {
                            const rating = index + 1;
                            return (
                              <button
                                key={rating}
                                type="button"
                                aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                                aria-pressed={commentRating === rating}
                                className={rating <= commentRating ? "selected" : ""}
                                onClick={() => setCommentRating(rating)}
                              >
                                <Star size={17} fill={rating <= commentRating ? "currentColor" : "none"} />
                              </button>
                            );
                          })}
                          {commentRating > 0 && <button className="clear-rating" type="button" onClick={() => setCommentRating(0)}>Clear</button>}
                        </div>
                      </div>
                      <button className="comment-submit" type="submit" disabled={postingComment || !commentText.trim()}>
                        <Send size={14} /> {postingComment ? "Posting..." : "Post comment"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="comment-sign-in">
                    <span>Sign in to join the conversation and rate this story.</span>
                    <button type="button" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>Sign in</button>
                  </div>
                )}
              </form>
              {commentsError && <p className="comment-error" role="alert">{commentsError}</p>}
              {commentsLoading ? <p className="comments-empty">Loading comments...</p> : comments.length ? (
                <div className="story-comment-list">
                  {comments.map((comment) => (
                    <article className="story-comment" key={comment.id}>
                      <div className="comment-avatar">
                        {comment.avatarUrl ? <img src={comment.avatarUrl} alt="" /> : comment.author.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="story-comment-content">
                        <div className="story-comment-meta">
                          <span><strong>{comment.author}</strong>{comment.username && <small>@{comment.username}</small>}</span>
                          <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString()}</time>
                        </div>
                        {comment.rating && <div className="comment-stars" aria-label={`${comment.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < comment.rating! ? "currentColor" : "none"} />)}
                        </div>}
                        <p>{comment.content}</p>
                        {user && (user.id === comment.userId || user.id === story.authorId) && (
                          <button className="comment-delete" type="button" onClick={() => void deleteComment(comment.id)}>Delete</button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : !commentsError && <p className="comments-empty">No comments yet. Start the conversation.</p>}
              {commentCount > comments.length && <p className="comments-empty">Showing the latest {comments.length} of {commentCount} comments.</p>}
            </section>
          )}
        </div>
      </article>
    </div>
  );
}

type StoryComment = {
  id: string;
  content: string;
  rating: number | null;
  createdAt: string;
  userId: string;
  author: string;
  username: string;
  avatarUrl: string | null;
};

function AuthModal({
  mode,
  setMode,
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
  onDiscordLogin,
  onClose,
}: {
  mode: "login" | "signup";
  setMode: (mode: "login" | "signup") => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDiscordLogin: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="auth-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close account form"
        >
          <X size={19} />
        </button>
        <div className="auth-mark">
          <Coffee size={22} />
        </div>
        <p className="eyebrow">Flip Stories</p>
        <h2>
          {mode === "login" ? "Welcome back." : "Make room for your story."}
        </h2>
        <p className="auth-intro">
          {mode === "login"
            ? "Your little corner of the reading room is waiting."
            : "Create an account to write, save, and follow."}
        </p>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="publish-button auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>
        {mode === "login" && <>
          <div className="auth-divider"><span>or</span></div>
          <button type="button" className="discord-button" onClick={() => void onDiscordLogin()} disabled={loading}>
            Continue with Discord
          </button>
        </>}
        <p className="auth-switch">
          {mode === "login"
            ? "New to Flip Stories?"
            : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
            }}
          >
            {" "}
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </section>
    </div>
  );
}
