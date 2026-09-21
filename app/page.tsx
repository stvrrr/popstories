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
  Menu,
  MoreHorizontal,
  Moon,
  PenLine,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Story = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  handle: string;
  initials: string;
  category: string;
  readTime: string;
  date: string;
  accent: string;
  likes: number;
};
const PAGE_LIMIT = 620;
const navItems = [
  { label: "Discover", icon: Home },
  { label: "Following", icon: Users },
  { label: "Dashboard", icon: BarChart3 },
];
const chartData: number[] = [];
const supabase = createClient();

export default function HomePage() {
  const [view, setView] = useState("Discover");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [readingStory, setReadingStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [pages, setPages] = useState([""]);
  const [activePage, setActivePage] = useState(0);
  const [storyTitle, setStoryTitle] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const loadStories = async () => {
    const { data } = await supabase
      .from("stories")
      .select(
        "id,title,excerpt,category,created_at,author_id,profiles!stories_author_id_fkey(username,display_name),likes(count)",
      )
      .eq("status", "published")
      .eq("visibility", "public")
      .order("published_at", { ascending: false });
    const loaded = (data ?? []) as Array<{
      id: string;
      title: string;
      excerpt: string | null;
      category: string | null;
      created_at: string;
      profiles: { username: string; display_name: string }[];
      likes: Array<{ count: number }>;
    }>;
    setStories(
      loaded.map((story, index) => ({
        id: story.id,
        title: story.title,
        excerpt: story.excerpt ?? "",
        author: story.profiles?.[0]?.display_name ?? "Anonymous writer",
        handle: story.profiles?.[0]?.username ?? "writer",
        initials: (story.profiles?.[0]?.display_name ?? "AW")
          .slice(0, 2)
          .toUpperCase(),
        category: story.category ?? "Personal essays",
        readTime: "5 min read",
        date: new Date(story.created_at).toLocaleDateString(),
        accent: ["sage", "terracotta", "mustard"][index % 3],
        likes: story.likes?.[0]?.count ?? 0,
      })),
    );
  };
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    );
    void loadStories();
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
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
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    notify("You have been signed out");
  };
  const toggleLike = (story: Story) =>
    setLiked((current) =>
      current.includes(story.id)
        ? current.filter((id) => id !== story.id)
        : [...current, story.id],
    );
  const toggleSave = (story: Story) => {
    setSaved((current) =>
      current.includes(story.id)
        ? current.filter((id) => id !== story.id)
        : [...current, story.id],
    );
    notify(
      saved.includes(story.id)
        ? "Removed from your shelf"
        : "Saved to your shelf",
    );
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
  const toggleFollow = (story: Story) => {
    setFollowing((current) =>
      current.includes(story.handle)
        ? current.filter((handle) => handle !== story.handle)
        : [...current, story.handle],
    );
    notify(
      following.includes(story.handle)
        ? `Unfollowed ${story.author}`
        : `Following ${story.author}`,
    );
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
    const excerpt = pages.join("\n\n").trim().slice(0, 180);
    if (editingStoryId) {
      const { error } = await supabase.from("stories").update({ title: storyTitle.trim(), excerpt, updated_at: new Date().toISOString() }).eq("id", editingStoryId).eq("author_id", user.id);
      if (error) { notify(error.message); return; }
      await supabase.from("story_pages").delete().eq("story_id", editingStoryId);
      const { error: pageError } = await supabase.from("story_pages").insert(pages.map((content, index) => ({ story_id: editingStoryId, page_number: index + 1, content })));
      if (pageError) { notify(pageError.message); return; }
      setEditingStoryId(null); setStoryTitle(""); setPages([""]); setActivePage(0); await loadStories(); setView("Shelf"); notify("Your story was updated"); return;
    }
    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        author_id: user.id,
        title: storyTitle.trim(),
        excerpt,
        category: "Personal essays",
        visibility: "public",
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
    setPages([""]);
    setActivePage(0);
    await loadStories();
    setView("Discover");
    notify("Your story is live");
  };

  return (
    <div className={`app-shell ${theme === "dark" ? "dark-mode" : ""}`}>
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <Coffee size={19} />
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
        <button
          className="profile-mini"
          onClick={() => (user ? handleSignOut() : setAuthOpen(true))}
        >
          <div className="avatar avatar-plum">
            {user ? (user.email?.[0] ?? "U").toUpperCase() : "NS"}
          </div>
          <div>
            <strong>{user ? user.email : "Sign in to Flip Stories"}</strong>
            <span>{user ? "Sign out" : "Read, write, and follow"}</span>
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
              {label === "Following" && <span className="nav-count">4</span>}
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
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === "light" ? "Night mode" : "Day mode"}</span>
            <span className="toggle-track">
              <span />
            </span>
          </button>
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
          >
            <Menu size={21} />
          </button>
          <div className="crumb">
            <span>Library</span>
            <ChevronRight size={14} />
            <strong>{view}</strong>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Search size={17} />
              <input placeholder="Search stories" aria-label="Search stories" />
              <kbd>⌘ K</kbd>
            </label>
            <button
              className="icon-button notification-button"
              onClick={() => notify("You are all caught up")}
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span />
            </button>
            <div className="avatar avatar-plum avatar-small">NS</div>
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
          />
        )}
        {view === "Following" && (
          <FollowingView
            setView={setView}
            stories={stories.filter((story) =>
              following.includes(story.handle),
            )}
            liked={liked}
            saved={saved}
            following={following}
            onLike={toggleLike}
            onSave={toggleSave}
            onFollow={toggleFollow}
            onRead={setReadingStory}
          />
        )}
        {view === "Dashboard" && (
          <Dashboard onWrite={() => setView("Write")} user={user} />
        )}
        {view === "Shelf" && (
          <ShelfView user={user} onWrite={() => { setEditingStoryId(null); setView("Write"); }} onEdit={async (storyId) => {
            const [{ data: story }, { data: pageRows }] = await Promise.all([
              supabase.from("stories").select("id,title").eq("id", storyId).single(),
              supabase.from("story_pages").select("page_number,content").eq("story_id", storyId).order("page_number"),
            ]);
            if (!story) { notify("That story could not be found"); return; }
            setEditingStoryId(story.id);
            setStoryTitle(story.title);
            setPages(pageRows?.map((page) => page.content) ?? [""]);
            setActivePage(0);
            setView("Write");
          }} onDelete={async (storyId) => {
            const { error } = await supabase.from("stories").delete().eq("id", storyId);
            if (error) { notify(error.message); return; }
            await loadStories();
            notify("Story deleted");
          }} />
        )}
        {view === "Write" && (
          <Writer
            setView={setView}
            user={user}
            storyTitle={storyTitle}
            setStoryTitle={setStoryTitle}
            pages={pages}
            activePage={activePage}
            setActivePage={setActivePage}
            updatePage={updatePage}
            addPage={addPage}
            notify={notify}
            onPublish={publishStory}
            editing={Boolean(editingStoryId)}
          />
        )}
      </main>
      {readingStory && (
        <ReaderModal
          story={readingStory}
          liked={liked.includes(readingStory.id)}
          saved={saved.includes(readingStory.id)}
          onClose={() => setReadingStory(null)}
          onLike={() => toggleLike(readingStory)}
          onSave={() => toggleSave(readingStory)}
          onShare={() => notify("Story link copied to your clipboard")}
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
}) {
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
  return (
    <section className="content-wrap">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">
            <Leaf size={14} /> Tuesday, September 21
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
      <div className="story-list">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            liked={liked.includes(story.id)}
            saved={saved.includes(story.id)}
            following={following.includes(story.handle)}
            onLike={() => onLike(story)}
            onSave={() => onSave(story)}
            onFollow={() => onFollow(story)}
            onRead={() => setReadingStory(story)}
          />
        ))}
      </div>
    </section>
  );
}

function FollowingView({
  setView,
  stories,
  liked,
  saved,
  following,
  onLike,
  onSave,
  onFollow,
  onRead,
}: {
  setView: (view: string) => void;
  stories: Story[];
  liked: string[];
  saved: string[];
  following: string[];
  onLike: (story: Story) => void;
  onSave: (story: Story) => void;
  onFollow: (story: Story) => void;
  onRead: (story: Story) => void;
}) {
  if (!stories.length) {
    return (
      <section className="content-wrap empty-feed">
        <p className="eyebrow"><Users size={14} /> Your circle</p>
        <h1>Your following list is <em>quiet.</em></h1>
        <p className="subtitle">Follow writers from Discover to see their new stories here.</p>
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
        <div className="stacked-avatars">
          <div className="avatar avatar-sage">MP</div>
          <div className="avatar avatar-rose">JR</div>
          <div className="avatar avatar-ochre">TB</div>
        </div>
        <span>
          You&apos;re following <strong>{following.length} writers</strong>
        </span>
        <button className="text-button" onClick={() => setView("Discover")}>
          Find more writers <ChevronRight size={15} />
        </button>
      </div>
      <div className="story-list following-list">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            liked={liked.includes(story.id)}
            saved={saved.includes(story.id)}
            following={following.includes(story.handle)}
            onLike={() => onLike(story)}
            onSave={() => onSave(story)}
            onFollow={() => onFollow(story)}
            onRead={() => onRead(story)}
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
}: {
  story: Story;
  liked: boolean;
  saved: boolean;
  following: boolean;
  onLike: () => void;
  onSave: () => void;
  onFollow: () => void;
  onRead: () => void;
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
          <span>{story.date}</span>
        </div>
        <h3>{story.title}</h3>
        <p>{story.excerpt}</p>
        <div className="story-card-bottom">
          <button className="author-chip" onClick={(event) => { event.stopPropagation(); onFollow(); }}>
            <span className={`avatar avatar-${story.accent}`}>
              {story.initials}
            </span>
            <span>
              <strong>{story.author}</strong>
              <small>{following ? "Following" : `@${story.handle}`}</small>
            </span>
          </button>
          <span className="read-time">{story.readTime}</span>
          <div className="story-actions">
            <button
              className={liked ? "liked" : ""}
              onClick={(event) => { event.stopPropagation(); onLike(); }}
              aria-label="Like story"
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
              <span>{story.likes + (liked ? 1 : 0)}</span>
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

function ShelfView({ user, onWrite, onEdit, onDelete }: { user: User | null; onWrite: () => void; onEdit: (storyId: string) => void; onDelete: (storyId: string) => void }) {
  const [stories, setStories] = useState<Array<{ id: string; title: string; excerpt: string | null; status: string; visibility: string; updated_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("stories").select("id,title,excerpt,status,visibility,updated_at").eq("author_id", user.id).order("updated_at", { ascending: false });
      if (active) { setStories(data ?? []); setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [user]);
  if (!user) return <section className="content-wrap empty-feed"><p className="eyebrow"><Bookmark size={14} /> Your shelf</p><h1>Sign in to keep your <em>stories.</em></h1><p className="subtitle">Your drafts, published stories, and edits will live here.</p></section>;
  return <section className="content-wrap shelf-wrap"><div className="page-heading"><div><p className="eyebrow"><Bookmark size={14} /> Your library</p><h1>Stories you&apos;ve <em>made.</em></h1><p className="subtitle">Edit, publish, or clear out anything on your shelf.</p></div><button className="primary-button" onClick={onWrite}><PenLine size={17} /> New story</button></div>{loading ? <p className="subtitle">Loading your shelf...</p> : !stories.length ? <div className="shelf-empty"><BookOpen size={24} /><h2>Your shelf is empty.</h2><p>Start with a page and make it yours.</p><button className="text-button" onClick={onWrite}>Write your first story <ChevronRight size={15} /></button></div> : <div className="shelf-list">{stories.map((story) => <article className="shelf-row" key={story.id}><div className="shelf-row-copy"><div className="story-card-meta"><span className={`status-pill status-${story.status}`}>{story.status}</span><span>{story.visibility}</span></div><h2>{story.title}</h2><p>{story.excerpt || "No excerpt yet."}</p><small>Updated {new Date(story.updated_at).toLocaleDateString()}</small></div><div className="shelf-row-actions"><button className="quiet-button" onClick={() => onEdit(story.id)}><PenLine size={15} /> Edit</button><button className="delete-button" onClick={() => { if (window.confirm(`Delete “${story.title}”?`)) onDelete(story.id); }}><X size={15} /> Delete</button></div></article>)}</div>}</section>;
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
      const storyIds = authoredStories.map((story) => story.id);
      if (storyIds.length === 0) {
        if (active) {
          setStats({
            views: 0,
            likes: 0,
            favorites: 0,
            shares: 0,
            stories: [],
            viewsByDay: Array(12).fill(0),
          });
          setLoading(false);
        }
        return;
      }
      const countFor = async (
        table: "story_views" | "likes" | "favorites" | "story_shares",
      ) => {
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .in("story_id", storyIds);
        return count ?? 0;
      };
      const [{ count: views }, likes, favorites, shares, { data: viewRows }] =
        await Promise.all([
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
        ]);
      const viewsByDay = Array(12).fill(0) as number[];
      (viewRows ?? []).forEach((view) => {
        const day = Math.floor(
          (Date.now() - new Date(view.created_at).getTime()) / 86400000,
        );
        if (day >= 0 && day < 12) viewsByDay[11 - day] += 1;
      });
      if (active) {
        setStats({
          views: views ?? 0,
          likes,
          favorites,
          shares,
          stories: authoredStories,
          viewsByDay,
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
      <div className="analytics-grid">
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
  pages,
  activePage,
  setActivePage,
  updatePage,
  addPage,
  notify,
  onPublish,
  editing,
}: {
  setView: (view: string) => void;
  user: User | null;
  storyTitle: string;
  setStoryTitle: (value: string) => void;
  pages: string[];
  activePage: number;
  setActivePage: (page: number) => void;
  updatePage: (value: string) => void;
  addPage: () => void;
  notify: (message: string) => void;
  onPublish: () => Promise<void>;
  editing: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = pages[activePage];
    updatePage(`${value.slice(0, start)}${before}${value.slice(start, end)}${after}${value.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    });
  };
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
          <div className="writing-tools">
            <button aria-label="Bold" onClick={() => wrapSelection("**", "**")}>
              <span className="tool-bold">B</span>
            </button>
            <button aria-label="Italic" onClick={() => wrapSelection("*", "*")}>
              <span className="tool-italic">I</span>
            </button>
            <span />
            <button aria-label="Add a photo">
              <Plus size={17} />
            </button>
            <button aria-label="More writing tools">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className="story-textarea"
            value={pages[activePage]}
            onChange={(event) => updatePage(event.target.value)}
            placeholder="Start with the moment you knew..."
          />
          <div
            className={`page-limit ${pages[activePage].length >= PAGE_LIMIT ? "page-limit-full" : ""}`}
          >
            <span>
              {pages[activePage].length} / {PAGE_LIMIT}
            </span>
            {pages[activePage].length >= PAGE_LIMIT && <span>Page full</span>}
          </div>
          {pages[activePage].length >= PAGE_LIMIT && (
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
          <label>
            Topic or feeling
            <input placeholder="e.g. growing up, home" />
          </label>
          <label>
            Who can read this?
            <select defaultValue="Everyone">
              <option>Everyone</option>
              <option>Followers only</option>
              <option>Only me</option>
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

function ReaderModal({
  story,
  liked,
  saved,
  onClose,
  onLike,
  onSave,
  onShare,
}: {
  story: Story;
  liked: boolean;
  saved: boolean;
  onClose: () => void;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
}) {
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
            <span className={`avatar avatar-${story.accent}`}>
              {story.initials}
            </span>
            <span>
              <strong>{story.author}</strong>
              <small>
                {story.readTime} · {story.date}
              </small>
            </span>
            <button onClick={onSave} className="reader-save">
              {saved ? "Saved" : "Save story"}{" "}
              <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="reader-body">
            <p>{story.excerpt}</p>
            <p>
              There are days when a story begins before we know to call it one.
              It lives in the small details: the warmth of a cup held between
              both hands, the familiar face across the room, the pause before a
              door opens.
            </p>
            <p>
              Maybe that is why we keep coming back to the same places. Not
              because they never change, but because they let us notice when we
              do.
            </p>
          </div>
          <div className="reader-actions">
            <button onClick={onLike} className={liked ? "liked" : ""}>
              <Heart size={17} fill={liked ? "currentColor" : "none"} />{" "}
              {liked ? "Liked" : "Like story"}
            </button>
            <button onClick={onShare}>
              <Share2 size={17} /> Share
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

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
