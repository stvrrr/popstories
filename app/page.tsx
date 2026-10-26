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
  Languages,
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
import { createContext, Fragment, useContext, useEffect, useRef, useState } from "react";
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
type Language = "en" | "es" | "fr" | "de" | "pt" | "it" | "ja" | "ko" | "zh" | "ar";
type NotificationKind = "like" | "favorite" | "comment" | "follow";
type NotificationItem = {
  id: string;
  kind: NotificationKind;
  actor: string;
  actorAvatar: string | null;
  storyTitle?: string;
  detail?: string;
  createdAt: string;
};
const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
  { value: "it", label: "Italiano" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文" },
  { value: "ar", label: "العربية" },
];
const NOTIFICATION_KINDS: NotificationKind[] = ["like", "follow", "favorite", "comment"];
function notificationKindLabel(kind: NotificationKind) {
  return kind === "like" ? "Likes"
    : kind === "follow" ? "Follows"
      : kind === "favorite" ? "Favorites"
        : "Comments";
}
function notificationSelectionLabel(kinds: NotificationKind[], t: (text: string) => string) {
  if (kinds.length === NOTIFICATION_KINDS.length) return t("All types");
  if (!kinds.length) return t("No types selected");
  return kinds.map((kind) => t(notificationKindLabel(kind))).join(", ");
}
const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR",
  it: "it-IT", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", ar: "ar",
};
const TRANSLATIONS: Record<Exclude<Language, "en">, Record<string, string>> = {
  es: {
    Discover: "Descubrir", People: "Personas", Following: "Siguiendo", Dashboard: "Panel", "Write a story": "Escribir una historia", "My shelf": "Mi biblioteca", Settings: "Ajustes", "Admin panel": "Panel de administración", "Your space": "Tu espacio", "Sign in to Flip Stories": "Inicia sesión en Flip Stories", "Account settings": "Ajustes de cuenta", "General settings": "Ajustes generales", Notifications: "Notificaciones", "Recent activity": "Actividad reciente", "Loading activity...": "Cargando actividad...", "Sign in to see activity.": "Inicia sesión para ver la actividad.", "No recent likes, comments, favorites, or follows.": "No hay Me gusta, comentarios, favoritos ni seguidores recientes.", "liked your story": "indicó que le gusta tu historia", "favorited your story": "guardó tu historia en favoritos", "commented on your story": "comentó tu historia", "started following you": "empezó a seguirte", General: "General", Profile: "Perfil", Preferences: "Preferencias", Appearance: "Apariencia", "Choose a light or dark reading room.": "Elige un modo claro u oscuro.", "Mobile navigation": "Navegación móvil", "Choose how to open the menu on smaller screens.": "Elige cómo abrir el menú en pantallas pequeñas.", "Bottom bar": "Barra inferior", Left: "Izquierda", Right: "Derecha", Language: "Idioma", "Choose the language for the app interface.": "Elige el idioma de la interfaz.", "Notification preferences": "Preferencias de notificaciones", "Choose which activity appears in your notifications.": "Elige qué actividad aparece en tus notificaciones.", Likes: "Me gusta", Follows: "Seguimientos", Favorites: "Favoritos", Comments: "Comentarios", "All types": "Todos los tipos", "No types selected": "Ningún tipo seleccionado", "Find your people.": "Encuentra a tu gente.", "Search people": "Buscar personas", "Search by name or @username": "Buscar por nombre o @usuario", "Readers and writers": "Lectores y escritores", "People discovery": "Descubrir personas", "Find more writers": "Encuentra más escritores", "Discover people": "Descubrir personas", "Write the first story": "Escribe la primera historia", Read: "Leer", "Follow": "Seguir", "Sign out": "Cerrar sesión", "Save profile": "Guardar perfil", "Change password": "Cambiar contraseña", "Change email": "Cambiar correo electrónico",
  },
  fr: {
    Discover: "Découvrir", People: "Personnes", Following: "Abonnements", Dashboard: "Tableau de bord", "Write a story": "Écrire une histoire", "My shelf": "Ma bibliothèque", Settings: "Paramètres", "Admin panel": "Administration", "Your space": "Votre espace", "Sign in to Flip Stories": "Se connecter à Flip Stories", "Account settings": "Paramètres du compte", "General settings": "Paramètres généraux", Notifications: "Notifications", "Recent activity": "Activité récente", "Loading activity...": "Chargement de l’activité...", "Sign in to see activity.": "Connectez-vous pour voir l’activité.", "No recent likes, comments, favorites, or follows.": "Aucun J’aime, commentaire, favori ou abonnement récent.", "liked your story": "a aimé votre histoire", "favorited your story": "a ajouté votre histoire aux favoris", "commented on your story": "a commenté votre histoire", "started following you": "a commencé à vous suivre", General: "Général", Profile: "Profil", Preferences: "Préférences", Appearance: "Apparence", "Choose a light or dark reading room.": "Choisissez un thème clair ou sombre.", "Mobile navigation": "Navigation mobile", "Choose how to open the menu on smaller screens.": "Choisissez comment ouvrir le menu sur petit écran.", "Bottom bar": "Barre inférieure", Left: "Gauche", Right: "Droite", Language: "Langue", "Choose the language for the app interface.": "Choisissez la langue de l’interface.", "Notification preferences": "Préférences de notification", "Choose which activity appears in your notifications.": "Choisissez les activités affichées dans vos notifications.", Likes: "J’aime", Follows: "Abonnements", Favorites: "Favoris", Comments: "Commentaires", "All types": "Tous les types", "No types selected": "Aucun type sélectionné", "Find your people.": "Trouvez votre communauté.", "Search people": "Rechercher des personnes", "Search by name or @username": "Rechercher par nom ou @pseudo", "Readers and writers": "Lecteurs et auteurs", "People discovery": "Découvrir des personnes", "Find more writers": "Trouver d’autres auteurs", "Discover people": "Découvrir des personnes", "Write the first story": "Écrire la première histoire", Read: "Lire", Follow: "Suivre", "Sign out": "Se déconnecter", "Save profile": "Enregistrer le profil", "Change password": "Changer le mot de passe", "Change email": "Changer l’adresse e-mail",
  },
  de: {
    Discover: "Entdecken", People: "Personen", Following: "Gefolgt", Dashboard: "Übersicht", "Write a story": "Geschichte schreiben", "My shelf": "Meine Bibliothek", Settings: "Einstellungen", "Admin panel": "Adminbereich", "Your space": "Dein Bereich", "Sign in to Flip Stories": "Bei Flip Stories anmelden", "Account settings": "Kontoeinstellungen", "General settings": "Allgemeine Einstellungen", Notifications: "Benachrichtigungen", "Recent activity": "Letzte Aktivitäten", "Loading activity...": "Aktivitäten werden geladen...", "Sign in to see activity.": "Melde dich an, um Aktivitäten zu sehen.", "No recent likes, comments, favorites, or follows.": "Keine neuen Likes, Kommentare, Favoriten oder Follower.", "liked your story": "gefällt deine Geschichte", "favorited your story": "hat deine Geschichte gespeichert", "commented on your story": "hat deine Geschichte kommentiert", "started following you": "folgt dir jetzt", General: "Allgemein", Profile: "Profil", Preferences: "Einstellungen", Appearance: "Darstellung", "Choose a light or dark reading room.": "Wähle ein helles oder dunkles Design.", "Mobile navigation": "Mobile Navigation", "Choose how to open the menu on smaller screens.": "Wähle, wie das Menü auf kleinen Bildschirmen geöffnet wird.", "Bottom bar": "Untere Leiste", Left: "Links", Right: "Rechts", Language: "Sprache", "Choose the language for the app interface.": "Wähle die Sprache der App-Oberfläche.", "Notification preferences": "Benachrichtigungseinstellungen", "Choose which activity appears in your notifications.": "Wähle, welche Aktivitäten angezeigt werden.", Likes: "Likes", Follows: "Follower", Favorites: "Favoriten", Comments: "Kommentare", "All types": "Alle Typen", "No types selected": "Keine Typen ausgewählt", "Find your people.": "Finde deine Community.", "Search people": "Personen suchen", "Search by name or @username": "Nach Name oder @Benutzername suchen", "Readers and writers": "Leser und Autoren", "People discovery": "Personen entdecken", "Find more writers": "Weitere Autoren finden", "Discover people": "Personen entdecken", "Write the first story": "Schreibe die erste Geschichte", Read: "Lesen", Follow: "Folgen", "Sign out": "Abmelden", "Save profile": "Profil speichern", "Change password": "Passwort ändern", "Change email": "E-Mail ändern",
  },
  pt: {
    Discover: "Descobrir", People: "Pessoas", Following: "Seguindo", Dashboard: "Painel", "Write a story": "Escrever uma história", "My shelf": "Minha biblioteca", Settings: "Configurações", "Admin panel": "Painel administrativo", "Your space": "Seu espaço", "Sign in to Flip Stories": "Entrar no Flip Stories", "Account settings": "Configurações da conta", "General settings": "Configurações gerais", Notifications: "Notificações", "Recent activity": "Atividade recente", "Loading activity...": "Carregando atividade...", "Sign in to see activity.": "Entre para ver a atividade.", "No recent likes, comments, favorites, or follows.": "Sem curtidas, comentários, favoritos ou novos seguidores.", "liked your story": "curtiu sua história", "favorited your story": "favoritou sua história", "commented on your story": "comentou sua história", "started following you": "começou a seguir você", General: "Geral", Profile: "Perfil", Preferences: "Preferências", Appearance: "Aparência", "Choose a light or dark reading room.": "Escolha um tema claro ou escuro.", "Mobile navigation": "Navegação móvel", "Choose how to open the menu on smaller screens.": "Escolha como abrir o menu em telas menores.", "Bottom bar": "Barra inferior", Left: "Esquerda", Right: "Direita", Language: "Idioma", "Choose the language for the app interface.": "Escolha o idioma da interface.", "Notification preferences": "Preferências de notificação", "Choose which activity appears in your notifications.": "Escolha quais atividades aparecem nas notificações.", Likes: "Curtidas", Follows: "Seguidores", Favorites: "Favoritos", Comments: "Comentários", "All types": "Todos os tipos", "No types selected": "Nenhum tipo selecionado", "Find your people.": "Encontre sua comunidade.", "Search people": "Buscar pessoas", "Search by name or @username": "Buscar por nome ou @usuário", "Readers and writers": "Leitores e escritores", "People discovery": "Descobrir pessoas", "Find more writers": "Encontrar escritores", "Discover people": "Descobrir pessoas", "Write the first story": "Escreva a primeira história", Read: "Ler", Follow: "Seguir", "Sign out": "Sair", "Save profile": "Salvar perfil", "Change password": "Alterar senha", "Change email": "Alterar e-mail",
  },
  it: {
    Discover: "Scopri", People: "Persone", Following: "Seguiti", Dashboard: "Dashboard", "Write a story": "Scrivi una storia", "My shelf": "La mia libreria", Settings: "Impostazioni", "Admin panel": "Pannello admin", "Your space": "Il tuo spazio", "Sign in to Flip Stories": "Accedi a Flip Stories", "Account settings": "Impostazioni account", "General settings": "Impostazioni generali", Notifications: "Notifiche", "Recent activity": "Attività recenti", "Loading activity...": "Caricamento attività...", "Sign in to see activity.": "Accedi per vedere le attività.", "No recent likes, comments, favorites, or follows.": "Nessun Mi piace, commento, preferito o nuovo follower.", "liked your story": "ha apprezzato la tua storia", "favorited your story": "ha salvato la tua storia tra i preferiti", "commented on your story": "ha commentato la tua storia", "started following you": "ha iniziato a seguirti", General: "Generale", Profile: "Profilo", Preferences: "Preferenze", Appearance: "Aspetto", "Choose a light or dark reading room.": "Scegli un tema chiaro o scuro.", "Mobile navigation": "Navigazione mobile", "Choose how to open the menu on smaller screens.": "Scegli come aprire il menu sugli schermi piccoli.", "Bottom bar": "Barra inferiore", Left: "Sinistra", Right: "Destra", Language: "Lingua", "Choose the language for the app interface.": "Scegli la lingua dell’interfaccia.", "Notification preferences": "Preferenze notifiche", "Choose which activity appears in your notifications.": "Scegli quali attività mostrare nelle notifiche.", Likes: "Mi piace", Follows: "Follower", Favorites: "Preferiti", Comments: "Commenti", "All types": "Tutti i tipi", "No types selected": "Nessun tipo selezionato", "Find your people.": "Trova la tua community.", "Search people": "Cerca persone", "Search by name or @username": "Cerca per nome o @username", "Readers and writers": "Lettori e scrittori", "People discovery": "Scopri persone", "Find more writers": "Trova altri scrittori", "Discover people": "Scopri persone", "Write the first story": "Scrivi la prima storia", Read: "Leggi", Follow: "Segui", "Sign out": "Esci", "Save profile": "Salva profilo", "Change password": "Cambia password", "Change email": "Cambia email",
  },
  ja: {
    Discover: "見つける", People: "ユーザー", Following: "フォロー中", Dashboard: "ダッシュボード", "Write a story": "ストーリーを書く", "My shelf": "マイライブラリ", Settings: "設定", "Admin panel": "管理パネル", "Your space": "マイスペース", "Sign in to Flip Stories": "Flip Storiesにログイン", "Account settings": "アカウント設定", "General settings": "一般設定", Notifications: "通知", "Recent activity": "最近のアクティビティ", "Loading activity...": "アクティビティを読み込み中...", "Sign in to see activity.": "ログインしてアクティビティを確認してください。", "No recent likes, comments, favorites, or follows.": "最近のいいね、コメント、お気に入り、フォローはありません。", "liked your story": "あなたのストーリーにいいねしました", "favorited your story": "あなたのストーリーをお気に入りに追加しました", "commented on your story": "あなたのストーリーにコメントしました", "started following you": "あなたをフォローし始めました", General: "一般", Profile: "プロフィール", Preferences: "環境設定", Appearance: "外観", "Choose a light or dark reading room.": "ライトまたはダークテーマを選択します。", "Mobile navigation": "モバイルナビゲーション", "Choose how to open the menu on smaller screens.": "小さい画面でのメニュー表示方法を選択します。", "Bottom bar": "下部バー", Left: "左", Right: "右", Language: "言語", "Choose the language for the app interface.": "アプリの表示言語を選択します。", "Notification preferences": "通知設定", "Choose which activity appears in your notifications.": "通知に表示するアクティビティを選択します。", Likes: "いいね", Follows: "フォロー", Favorites: "お気に入り", Comments: "コメント", "All types": "すべて", "No types selected": "未選択", "Find your people.": "仲間を見つけよう。", "Search people": "ユーザーを検索", "Search by name or @username": "名前または@ユーザー名で検索", "Readers and writers": "読者と作家", "People discovery": "ユーザーを探す", "Find more writers": "作家をもっと探す", "Discover people": "ユーザーを探す", "Write the first story": "最初のストーリーを書く", Read: "読む", Follow: "フォロー", "Sign out": "ログアウト", "Save profile": "プロフィールを保存", "Change password": "パスワードを変更", "Change email": "メールアドレスを変更",
  },
  ko: {
    Discover: "둘러보기", People: "사용자", Following: "팔로잉", Dashboard: "대시보드", "Write a story": "스토리 쓰기", "My shelf": "내 서재", Settings: "설정", "Admin panel": "관리자 패널", "Your space": "내 공간", "Sign in to Flip Stories": "Flip Stories 로그인", "Account settings": "계정 설정", "General settings": "일반 설정", Notifications: "알림", "Recent activity": "최근 활동", "Loading activity...": "활동 불러오는 중...", "Sign in to see activity.": "활동을 보려면 로그인하세요.", "No recent likes, comments, favorites, or follows.": "최근 좋아요, 댓글, 즐겨찾기 또는 팔로우가 없습니다.", "liked your story": "님이 회원님의 스토리를 좋아합니다", "favorited your story": "님이 회원님의 스토리를 즐겨찾기에 추가했습니다", "commented on your story": "님이 회원님의 스토리에 댓글을 남겼습니다", "started following you": "님이 회원님을 팔로우하기 시작했습니다", General: "일반", Profile: "프로필", Preferences: "환경 설정", Appearance: "모양", "Choose a light or dark reading room.": "밝거나 어두운 테마를 선택하세요.", "Mobile navigation": "모바일 탐색", "Choose how to open the menu on smaller screens.": "작은 화면에서 메뉴를 여는 방식을 선택하세요.", "Bottom bar": "하단 바", Left: "왼쪽", Right: "오른쪽", Language: "언어", "Choose the language for the app interface.": "앱 인터페이스 언어를 선택하세요.", "Notification preferences": "알림 설정", "Choose which activity appears in your notifications.": "알림에 표시할 활동을 선택하세요.", Likes: "좋아요", Follows: "팔로우", Favorites: "즐겨찾기", Comments: "댓글", "All types": "전체 유형", "No types selected": "선택한 유형 없음", "Find your people.": "새로운 사람을 만나보세요.", "Search people": "사용자 검색", "Search by name or @username": "이름 또는 @사용자 이름 검색", "Readers and writers": "독자와 작가", "People discovery": "사용자 찾기", "Find more writers": "작가 더 찾기", "Discover people": "사용자 찾기", "Write the first story": "첫 스토리 쓰기", Read: "읽기", Follow: "팔로우", "Sign out": "로그아웃", "Save profile": "프로필 저장", "Change password": "비밀번호 변경", "Change email": "이메일 변경",
  },
  zh: {
    Discover: "发现", People: "用户", Following: "关注", Dashboard: "控制面板", "Write a story": "写故事", "My shelf": "我的书架", Settings: "设置", "Admin panel": "管理面板", "Your space": "你的空间", "Sign in to Flip Stories": "登录 Flip Stories", "Account settings": "账户设置", "General settings": "常规设置", Notifications: "通知", "Recent activity": "最近动态", "Loading activity...": "正在加载动态...", "Sign in to see activity.": "登录后查看动态。", "No recent likes, comments, favorites, or follows.": "暂无新的点赞、评论、收藏或关注。", "liked your story": "赞了你的故事", "favorited your story": "收藏了你的故事", "commented on your story": "评论了你的故事", "started following you": "开始关注你", General: "常规", Profile: "个人资料", Preferences: "偏好设置", Appearance: "外观", "Choose a light or dark reading room.": "选择浅色或深色主题。", "Mobile navigation": "移动导航", "Choose how to open the menu on smaller screens.": "选择在小屏幕上打开菜单的方式。", "Bottom bar": "底部栏", Left: "左侧", Right: "右侧", Language: "语言", "Choose the language for the app interface.": "选择应用界面语言。", "Notification preferences": "通知偏好", "Choose which activity appears in your notifications.": "选择通知中显示的动态类型。", Likes: "点赞", Follows: "关注", Favorites: "收藏", Comments: "评论", "All types": "全部类型", "No types selected": "未选择类型", "Find your people.": "找到志同道合的人。", "Search people": "搜索用户", "Search by name or @username": "按名称或 @用户名搜索", "Readers and writers": "读者与作者", "People discovery": "发现用户", "Find more writers": "发现更多作者", "Discover people": "发现用户", "Write the first story": "写下第一个故事", Read: "阅读", Follow: "关注", "Sign out": "退出登录", "Save profile": "保存资料", "Change password": "修改密码", "Change email": "修改邮箱",
  },
  ar: {
    Discover: "اكتشف", People: "الأشخاص", Following: "المتابَعون", Dashboard: "لوحة التحكم", "Write a story": "اكتب قصة", "My shelf": "مكتبتي", Settings: "الإعدادات", "Admin panel": "لوحة الإدارة", "Your space": "مساحتك", "Sign in to Flip Stories": "سجّل الدخول إلى Flip Stories", "Account settings": "إعدادات الحساب", "General settings": "الإعدادات العامة", Notifications: "الإشعارات", "Recent activity": "النشاط الأخير", "Loading activity...": "جارٍ تحميل النشاط...", "Sign in to see activity.": "سجّل الدخول لعرض النشاط.", "No recent likes, comments, favorites, or follows.": "لا توجد إعجابات أو تعليقات أو مفضلات أو متابعات حديثة.", "liked your story": "أُعجب بقصتك", "favorited your story": "أضاف قصتك إلى المفضلة", "commented on your story": "علّق على قصتك", "started following you": "بدأ بمتابعتك", General: "عام", Profile: "الملف الشخصي", Preferences: "التفضيلات", Appearance: "المظهر", "Choose a light or dark reading room.": "اختر مظهراً فاتحاً أو داكناً.", "Mobile navigation": "التنقل على الهاتف", "Choose how to open the menu on smaller screens.": "اختر طريقة فتح القائمة على الشاشات الصغيرة.", "Bottom bar": "الشريط السفلي", Left: "يسار", Right: "يمين", Language: "اللغة", "Choose the language for the app interface.": "اختر لغة واجهة التطبيق.", "Notification preferences": "تفضيلات الإشعارات", "Choose which activity appears in your notifications.": "اختر الأنشطة التي تظهر في إشعاراتك.", Likes: "الإعجابات", Follows: "المتابعات", Favorites: "المفضلة", Comments: "التعليقات", "All types": "كل الأنواع", "No types selected": "لم يتم اختيار أنواع", "Find your people.": "اعثر على مجتمعك.", "Search people": "ابحث عن أشخاص", "Search by name or @username": "ابحث بالاسم أو @اسم_المستخدم", "Readers and writers": "القراء والكتّاب", "People discovery": "اكتشاف الأشخاص", "Find more writers": "اعثر على كتّاب آخرين", "Discover people": "اكتشف أشخاصاً", "Write the first story": "اكتب القصة الأولى", Read: "اقرأ", Follow: "متابعة", "Sign out": "تسجيل الخروج", "Save profile": "حفظ الملف الشخصي", "Change password": "تغيير كلمة المرور", "Change email": "تغيير البريد الإلكتروني",
  },
};
const EXTRA_TRANSLATIONS: Record<Exclude<Language, "en">, Record<string, string>> = {
  es: {
    "Make Flip Stories feel right for you.": "Personaliza Flip Stories a tu gusto.",
    "Choose how the reading room looks and works on this device.": "Elige el aspecto y el funcionamiento de la aplicación en este dispositivo.",
    Light: "Claro", Dark: "Oscuro", Library: "Biblioteca", "Join Discord": "Unirse a Discord",
    "Your library": "Tu biblioteca", "Your stories": "Tus historias", "Saved stories": "Historias guardadas", "Made by you": "Creadas por ti", "From Discover": "De Descubrir",
    "Stories you’ve written and stories you’ve saved.": "Historias que has escrito y guardado.", "No saved stories yet.": "Aún no tienes historias guardadas.", "Favorite stories in Discover and they’ll appear here.": "Añade historias a favoritos en Descubrir y aparecerán aquí.",
    "Find your people.": "Encuentra a tu gente.", "Finding people...": "Buscando personas...", "No profiles to discover yet.": "Aún no hay perfiles para descubrir.", "A Flip Stories community member.": "Miembro de la comunidad Flip Stories.",
    "Search by name or @username": "Busca por nombre o @usuario", "Search people": "Buscar personas", "Readers and writers": "Lectores y escritores",
    "No types selected": "No hay tipos seleccionados", "All types": "Todos los tipos",
    "The reading room": "La sala de lectura", "Stories from the community": "Historias de la comunidad", "View all": "Ver todo", "Search story titles": "Buscar títulos de historias", Genre: "Género", "Filter stories by genre": "Filtrar historias por género", "All genres": "Todos los géneros", Browse: "Explorar", "Filter stories by popularity and length": "Filtrar historias por popularidad y extensión", "All stories": "Todas las historias", Popular: "Popular", Hot: "Tendencias", "New / Recent": "Nuevas / recientes", "Short read": "Lectura breve", "Long read": "Lectura larga", "No stories match that search.": "Ninguna historia coincide con la búsqueda.", "The community": "La comunidad", "Find your": "Encuentra a tu", "people.": "gente.", "Discover writers, meet new voices, and find your next favorite storyteller.": "Descubre escritores, conoce nuevas voces y encuentra a tu próximo narrador favorito.", people: "personas", "Search people by name or username": "Buscar personas por nombre o usuario", "Updating...": "Actualizando...", "No people found for": "No se encontraron personas para", "Close menu": "Cerrar menú", "Toggle menu": "Alternar menú", "Main navigation": "Navegación principal", "Small stories matter.": "Las historias pequeñas importan.", "Make room for yours.": "Haz espacio para la tuya.", "Open settings": "Abrir ajustes", "Sign in": "Iniciar sesión", "There are no published stories": "Aún no hay historias publicadas", "yet.": "todavía.", "Be the first person to leave something kind on the table.": "Sé la primera persona en compartir algo amable.", "A quiet place for": "Un lugar tranquilo para", "good stories.": "buenas historias.", "Pull up a chair. There’s something new to read.": "Toma asiento. Hay algo nuevo para leer.",
    English: "Inglés", Translate: "Traducir", "Hide translation": "Ocultar traducción", "Translating...": "Traduciendo...",
  },
  fr: {
    "Make Flip Stories feel right for you.": "Personnalisez Flip Stories selon vos envies.",
    "Choose how the reading room looks and works on this device.": "Choisissez l’apparence et le fonctionnement de l’application sur cet appareil.",
    Light: "Clair", Dark: "Sombre", Library: "Bibliothèque", "Join Discord": "Rejoindre Discord",
    "Your library": "Votre bibliothèque", "Your stories": "Vos histoires", "Saved stories": "Histoires enregistrées", "Made by you": "Créées par vous", "From Discover": "Depuis Découvrir",
    "Stories you’ve written and stories you’ve saved.": "Les histoires que vous avez écrites et enregistrées.", "No saved stories yet.": "Aucune histoire enregistrée pour l’instant.", "Favorite stories in Discover and they’ll appear here.": "Ajoutez des histoires aux favoris dans Découvrir pour les retrouver ici.",
    "Finding people...": "Recherche de personnes...", "No profiles to discover yet.": "Aucun profil à découvrir pour l’instant.", "A Flip Stories community member.": "Membre de la communauté Flip Stories.",
    "The reading room": "La salle de lecture", "Stories from the community": "Histoires de la communauté", "View all": "Tout voir", "Search story titles": "Rechercher des titres d’histoires", Genre: "Genre", "Filter stories by genre": "Filtrer les histoires par genre", "All genres": "Tous les genres", Browse: "Explorer", "Filter stories by popularity and length": "Filtrer par popularité et longueur", "All stories": "Toutes les histoires", Popular: "Populaires", Hot: "Tendances", "New / Recent": "Nouvelles / récentes", "Short read": "Lecture courte", "Long read": "Lecture longue", "No stories match that search.": "Aucune histoire ne correspond à cette recherche.", "The community": "La communauté", "Find your": "Trouvez votre", "people.": "communauté.", "Discover writers, meet new voices, and find your next favorite storyteller.": "Découvrez des auteurs, de nouvelles voix et votre prochain conteur favori.", people: "personnes", "Search people by name or username": "Rechercher par nom ou pseudo", "Updating...": "Mise à jour...", "No people found for": "Aucune personne trouvée pour", "Close menu": "Fermer le menu", "Toggle menu": "Afficher/masquer le menu", "Main navigation": "Navigation principale", "Small stories matter.": "Les petites histoires comptent.", "Make room for yours.": "Faites de la place pour la vôtre.", "Open settings": "Ouvrir les paramètres", "Sign in": "Se connecter", "There are no published stories": "Aucune histoire n’a encore été publiée", "yet.": "pour l’instant.", "Be the first person to leave something kind on the table.": "Soyez la première personne à partager quelque chose de positif.", "A quiet place for": "Un endroit calme pour", "good stories.": "de belles histoires.", "Pull up a chair. There’s something new to read.": "Installez-vous. Une nouvelle histoire vous attend.",
    English: "Anglais", Translate: "Traduire", "Hide translation": "Masquer la traduction", "Translating...": "Traduction en cours...",
  },
  de: {
    "Make Flip Stories feel right for you.": "Passe Flip Stories an deine Wünsche an.",
    "Choose how the reading room looks and works on this device.": "Lege fest, wie die App auf diesem Gerät aussieht und funktioniert.",
    Light: "Hell", Dark: "Dunkel", Library: "Bibliothek", "Join Discord": "Discord beitreten",
    "Your library": "Deine Bibliothek", "Your stories": "Deine Geschichten", "Saved stories": "Gespeicherte Geschichten", "Made by you": "Von dir erstellt", "From Discover": "Aus Entdecken",
    "Stories you’ve written and stories you’ve saved.": "Deine geschriebenen und gespeicherten Geschichten.", "No saved stories yet.": "Noch keine gespeicherten Geschichten.", "Favorite stories in Discover and they’ll appear here.": "Speichere Geschichten unter Entdecken, damit sie hier erscheinen.",
    "Finding people...": "Personen werden gesucht...", "No profiles to discover yet.": "Noch keine Profile zum Entdecken.", "A Flip Stories community member.": "Mitglied der Flip-Stories-Community.",
    "The reading room": "Der Leseraum", "Stories from the community": "Geschichten aus der Community", "View all": "Alle ansehen", "Search story titles": "Geschichtentitel suchen", Genre: "Genre", "Filter stories by genre": "Geschichten nach Genre filtern", "All genres": "Alle Genres", Browse: "Entdecken", "Filter stories by popularity and length": "Nach Beliebtheit und Länge filtern", "All stories": "Alle Geschichten", Popular: "Beliebt", Hot: "Im Trend", "New / Recent": "Neu / Kürzlich", "Short read": "Kurze Lektüre", "Long read": "Lange Lektüre", "No stories match that search.": "Keine Geschichten entsprechen dieser Suche.", "The community": "Die Community", "Find your": "Finde deine", "people.": "Leute.", "Discover writers, meet new voices, and find your next favorite storyteller.": "Entdecke Schreibende, neue Stimmen und deine nächste Lieblingsgeschichte.", people: "Personen", "Search people by name or username": "Nach Namen oder Benutzernamen suchen", "Updating...": "Wird aktualisiert...", "No people found for": "Keine Personen gefunden für", "Close menu": "Menü schließen", "Toggle menu": "Menü umschalten", "Main navigation": "Hauptnavigation", "Small stories matter.": "Kleine Geschichten sind wichtig.", "Make room for yours.": "Mach Platz für deine.", "Open settings": "Einstellungen öffnen", "Sign in": "Anmelden", "There are no published stories": "Es wurden noch keine Geschichten veröffentlicht", "yet.": "noch nicht.", "Be the first person to leave something kind on the table.": "Teile als Erste:r etwas Schönes mit der Community.", "A quiet place for": "Ein ruhiger Ort für", "good stories.": "gute Geschichten.", "Pull up a chair. There’s something new to read.": "Mach es dir gemütlich. Es gibt etwas Neues zu lesen.",
    English: "Englisch", Translate: "Übersetzen", "Hide translation": "Übersetzung ausblenden", "Translating...": "Übersetzung läuft...",
  },
  pt: {
    "Make Flip Stories feel right for you.": "Personalize o Flip Stories do seu jeito.",
    "Choose how the reading room looks and works on this device.": "Escolha a aparência e o funcionamento do app neste dispositivo.",
    Light: "Claro", Dark: "Escuro", Library: "Biblioteca", "Join Discord": "Entrar no Discord",
    "Your library": "Sua biblioteca", "Your stories": "Suas histórias", "Saved stories": "Histórias salvas", "Made by you": "Criadas por você", "From Discover": "Do Descobrir",
    "Stories you’ve written and stories you’ve saved.": "Histórias que você escreveu e salvou.", "No saved stories yet.": "Nenhuma história salva ainda.", "Favorite stories in Discover and they’ll appear here.": "Salve histórias no Descobrir para vê-las aqui.",
    "Finding people...": "Buscando pessoas...", "No profiles to discover yet.": "Nenhum perfil para descobrir ainda.", "A Flip Stories community member.": "Membro da comunidade Flip Stories.",
    "The reading room": "A sala de leitura", "Stories from the community": "Histórias da comunidade", "View all": "Ver tudo", "Search story titles": "Buscar títulos de histórias", Genre: "Gênero", "Filter stories by genre": "Filtrar histórias por gênero", "All genres": "Todos os gêneros", Browse: "Explorar", "Filter stories by popularity and length": "Filtrar por popularidade e tamanho", "All stories": "Todas as histórias", Popular: "Populares", Hot: "Em alta", "New / Recent": "Novas / recentes", "Short read": "Leitura curta", "Long read": "Leitura longa", "No stories match that search.": "Nenhuma história corresponde à busca.", "The community": "A comunidade", "Find your": "Encontre suas", "people.": "pessoas.", "Discover writers, meet new voices, and find your next favorite storyteller.": "Descubra escritores, conheça novas vozes e encontre seu próximo contador de histórias favorito.", people: "pessoas", "Search people by name or username": "Buscar pessoas por nome ou usuário", "Updating...": "Atualizando...", "No people found for": "Nenhuma pessoa encontrada para", "Close menu": "Fechar menu", "Toggle menu": "Alternar menu", "Main navigation": "Navegação principal", "Small stories matter.": "Pequenas histórias importam.", "Make room for yours.": "Abra espaço para a sua.", "Open settings": "Abrir configurações", "Sign in": "Entrar", "There are no published stories": "Ainda não há histórias publicadas", "yet.": "ainda.", "Be the first person to leave something kind on the table.": "Seja a primeira pessoa a compartilhar algo gentil.", "A quiet place for": "Um lugar tranquilo para", "good stories.": "boas histórias.", "Pull up a chair. There’s something new to read.": "Sente-se. Há algo novo para ler.",
    English: "Inglês", Translate: "Traduzir", "Hide translation": "Ocultar tradução", "Translating...": "Traduzindo...",
  },
  it: {
    "Make Flip Stories feel right for you.": "Personalizza Flip Stories come preferisci.",
    "Choose how the reading room looks and works on this device.": "Scegli l’aspetto e il funzionamento dell’app su questo dispositivo.",
    Light: "Chiaro", Dark: "Scuro", Library: "Libreria", "Join Discord": "Unisciti a Discord",
    "Your library": "La tua libreria", "Your stories": "Le tue storie", "Saved stories": "Storie salvate", "Made by you": "Create da te", "From Discover": "Da Scopri",
    "Stories you’ve written and stories you’ve saved.": "Le storie che hai scritto e salvato.", "No saved stories yet.": "Non hai ancora storie salvate.", "Favorite stories in Discover and they’ll appear here.": "Aggiungi storie ai preferiti in Scopri per trovarle qui.",
    "Finding people...": "Ricerca di persone...", "No profiles to discover yet.": "Nessun profilo da scoprire per ora.", "A Flip Stories community member.": "Membro della community Flip Stories.",
    "The reading room": "La sala di lettura", "Stories from the community": "Storie della community", "View all": "Mostra tutto", "Search story titles": "Cerca i titoli delle storie", Genre: "Genere", "Filter stories by genre": "Filtra le storie per genere", "All genres": "Tutti i generi", Browse: "Esplora", "Filter stories by popularity and length": "Filtra per popolarità e lunghezza", "All stories": "Tutte le storie", Popular: "Popolari", Hot: "Di tendenza", "New / Recent": "Nuove / recenti", "Short read": "Lettura breve", "Long read": "Lettura lunga", "No stories match that search.": "Nessuna storia corrisponde alla ricerca.", "The community": "La community", "Find your": "Trova le tue", "people.": "persone.", "Discover writers, meet new voices, and find your next favorite storyteller.": "Scopri scrittori, nuove voci e il tuo prossimo narratore preferito.", people: "persone", "Search people by name or username": "Cerca persone per nome o nome utente", "Updating...": "Aggiornamento...", "No people found for": "Nessuna persona trovata per", "Close menu": "Chiudi menu", "Toggle menu": "Apri/chiudi menu", "Main navigation": "Navigazione principale", "Small stories matter.": "Le piccole storie contano.", "Make room for yours.": "Fai spazio alla tua.", "Open settings": "Apri impostazioni", "Sign in": "Accedi", "There are no published stories": "Non ci sono ancora storie pubblicate", "yet.": "ancora.", "Be the first person to leave something kind on the table.": "Sii la prima persona a condividere qualcosa di gentile.", "A quiet place for": "Un posto tranquillo per", "good stories.": "belle storie.", "Pull up a chair. There’s something new to read.": "Accomodati. C’è qualcosa di nuovo da leggere.",
    English: "Inglese", Translate: "Traduci", "Hide translation": "Nascondi traduzione", "Translating...": "Traduzione in corso...",
  },
  ja: {
    "Make Flip Stories feel right for you.": "Flip Storiesを自分好みに設定しましょう。",
    "Choose how the reading room looks and works on this device.": "この端末でのアプリの表示や動作を設定します。",
    Light: "ライト", Dark: "ダーク", Library: "ライブラリ", "Join Discord": "Discordに参加",
    "Your library": "マイライブラリ", "Your stories": "自分のストーリー", "Saved stories": "保存したストーリー", "Made by you": "自分で作成", "From Discover": "見つけるから",
    "Stories you’ve written and stories you’ve saved.": "作成したストーリーと保存したストーリー。", "No saved stories yet.": "保存したストーリーはありません。", "Favorite stories in Discover and they’ll appear here.": "ストーリーをお気に入りに追加すると、ここに表示されます。",
    "Finding people...": "ユーザーを検索中...", "No profiles to discover yet.": "まだユーザーがいません。", "A Flip Stories community member.": "Flip Storiesコミュニティのメンバー。",
    English: "英語", Translate: "翻訳", "Hide translation": "翻訳を隠す", "Translating...": "翻訳中...",
  },
  ko: {
    "Make Flip Stories feel right for you.": "Flip Stories를 원하는 대로 설정하세요.",
    "Choose how the reading room looks and works on this device.": "이 기기에서 앱이 표시되고 작동하는 방식을 선택하세요.",
    Light: "라이트", Dark: "다크", Library: "서재", "Join Discord": "Discord 참여",
    "Your library": "내 서재", "Your stories": "내 스토리", "Saved stories": "저장한 스토리", "Made by you": "내가 작성함", "From Discover": "둘러보기에서",
    "Stories you’ve written and stories you’ve saved.": "작성하거나 저장한 스토리입니다.", "No saved stories yet.": "저장한 스토리가 없습니다.", "Favorite stories in Discover and they’ll appear here.": "둘러보기에서 스토리를 즐겨찾기에 추가하면 여기에 표시됩니다.",
    "Finding people...": "사용자 검색 중...", "No profiles to discover yet.": "아직 둘러볼 사용자가 없습니다.", "A Flip Stories community member.": "Flip Stories 커뮤니티 회원입니다.",
    "The reading room": "이야기 공간", "Stories from the community": "커뮤니티 이야기", "View all": "모두 보기", "Search story titles": "스토리 제목 검색", Genre: "장르", "Filter stories by genre": "장르별 스토리 필터", "All genres": "모든 장르", Browse: "둘러보기", "Filter stories by popularity and length": "인기와 길이별 필터", "All stories": "모든 스토리", Popular: "인기", Hot: "인기 급상승", "New / Recent": "신규 / 최신", "Short read": "짧은 글", "Long read": "긴 글", "No stories match that search.": "검색 결과가 없습니다.", "The community": "커뮤니티", "Find your": "마음에 맞는", "people.": "사람을 찾아보세요.", "Discover writers, meet new voices, and find your next favorite storyteller.": "작가와 새로운 목소리를 만나고 좋아하는 이야기를 찾아보세요.", people: "명", "Search people by name or username": "이름 또는 사용자 이름으로 검색", "Updating...": "업데이트 중...", "No people found for": "검색된 사용자가 없습니다:", "Close menu": "메뉴 닫기", "Toggle menu": "메뉴 전환", "Main navigation": "주 메뉴", "Small stories matter.": "작은 이야기도 소중합니다.", "Make room for yours.": "당신의 이야기를 위한 자리를 만드세요.", "Open settings": "설정 열기", "Sign in": "로그인", "There are no published stories": "아직 공개된 스토리가 없습니다", "yet.": "아직.", "Be the first person to leave something kind on the table.": "따뜻한 이야기를 가장 먼저 나눠보세요.", "A quiet place for": "좋은 이야기를 위한", "good stories.": "조용한 공간.", "Pull up a chair. There’s something new to read.": "편하게 앉아 새로운 이야기를 읽어보세요.",
    English: "영어", Translate: "번역", "Hide translation": "번역 숨기기", "Translating...": "번역 중...",
  },
  zh: {
    "Make Flip Stories feel right for you.": "按你的喜好自定义 Flip Stories。",
    "Choose how the reading room looks and works on this device.": "选择应用在此设备上的外观和操作方式。",
    Light: "浅色", Dark: "深色", Library: "书架", "Join Discord": "加入 Discord",
    "Your library": "我的书架", "Your stories": "我的故事", "Saved stories": "已收藏的故事", "Made by you": "由你创作", "From Discover": "来自发现",
    "Stories you’ve written and stories you’ve saved.": "你创作和收藏的故事。", "No saved stories yet.": "还没有收藏的故事。", "Favorite stories in Discover and they’ll appear here.": "在发现页面收藏故事，它们就会显示在这里。",
    "Finding people...": "正在搜索用户...", "No profiles to discover yet.": "暂时没有可发现的用户。", "A Flip Stories community member.": "Flip Stories 社区成员。",
    "The reading room": "阅读空间", "Stories from the community": "社区故事", "View all": "查看全部", "Search story titles": "搜索故事标题", Genre: "类型", "Filter stories by genre": "按类型筛选故事", "All genres": "所有类型", Browse: "浏览", "Filter stories by popularity and length": "按热度和篇幅筛选", "All stories": "所有故事", Popular: "热门", Hot: "火热", "New / Recent": "最新", "Short read": "短篇", "Long read": "长篇", "No stories match that search.": "没有符合搜索条件的故事。", "The community": "社区", "Find your": "找到你的", "people.": "同好。", "Discover writers, meet new voices, and find your next favorite storyteller.": "发现作者、结识新声音，找到你喜欢的讲故事的人。", people: "位用户", "Search people by name or username": "按姓名或用户名搜索", "Updating...": "正在更新...", "No people found for": "未找到相关用户：", "Close menu": "关闭菜单", "Toggle menu": "切换菜单", "Main navigation": "主导航", "Small stories matter.": "小故事也很重要。", "Make room for yours.": "为你的故事留个位置。", "Open settings": "打开设置", "Sign in": "登录", "There are no published stories": "还没有已发布的故事", "yet.": "暂时。", "Be the first person to leave something kind on the table.": "来分享一段温暖的故事吧。", "A quiet place for": "一个安静的空间，", "good stories.": "留给好故事。", "Pull up a chair. There’s something new to read.": "坐下来，读读新故事吧。",
    English: "英语", Translate: "翻译", "Hide translation": "隐藏翻译", "Translating...": "正在翻译...",
  },
  ar: {
    "Make Flip Stories feel right for you.": "خصّص Flip Stories كما تحب.",
    "Choose how the reading room looks and works on this device.": "اختر مظهر التطبيق وطريقة عمله على هذا الجهاز.",
    Light: "فاتح", Dark: "داكن", Library: "المكتبة", "Join Discord": "انضم إلى Discord",
    "Your library": "مكتبتي", "Your stories": "قصصك", "Saved stories": "القصص المحفوظة", "Made by you": "من تأليفك", "From Discover": "من اكتشف",
    "Stories you’ve written and stories you’ve saved.": "القصص التي كتبتها وحفظتها.", "No saved stories yet.": "لا توجد قصص محفوظة بعد.", "Favorite stories in Discover and they’ll appear here.": "أضف القصص إلى المفضلة في اكتشف لتظهر هنا.",
    "Finding people...": "جارٍ البحث عن أشخاص...", "No profiles to discover yet.": "لا توجد ملفات شخصية لاكتشافها بعد.", "A Flip Stories community member.": "عضو في مجتمع Flip Stories.",
    "The reading room": "مساحة القراءة", "Stories from the community": "قصص المجتمع", "View all": "عرض الكل", "Search story titles": "ابحث عن عناوين القصص", Genre: "النوع", "Filter stories by genre": "تصفية القصص حسب النوع", "All genres": "كل الأنواع", Browse: "استكشاف", "Filter stories by popularity and length": "تصفية حسب الشعبية والطول", "All stories": "كل القصص", Popular: "الأكثر شعبية", Hot: "رائجة", "New / Recent": "حديثة", "Short read": "قراءة قصيرة", "Long read": "قراءة طويلة", "No stories match that search.": "لا توجد قصص تطابق بحثك.", "The community": "المجتمع", "Find your": "اعثر على", "people.": "أشخاص يشبهونك.", "Discover writers, meet new voices, and find your next favorite storyteller.": "اكتشف الكتّاب والأصوات الجديدة واعثر على حكّاءك المفضل التالي.", people: "أشخاص", "Search people by name or username": "ابحث بالاسم أو اسم المستخدم", "Updating...": "جارٍ التحديث...", "No people found for": "لم يتم العثور على أشخاص لـ", "Close menu": "إغلاق القائمة", "Toggle menu": "تبديل القائمة", "Main navigation": "التنقل الرئيسي", "Small stories matter.": "القصص الصغيرة مهمة.", "Make room for yours.": "اترك مساحة لقصتك.", "Open settings": "فتح الإعدادات", "Sign in": "تسجيل الدخول", "There are no published stories": "لا توجد قصص منشورة", "yet.": "حتى الآن.", "Be the first person to leave something kind on the table.": "كن أول من يشارك قصة لطيفة.", "A quiet place for": "مكان هادئ من أجل", "good stories.": "القصص الجميلة.", "Pull up a chair. There’s something new to read.": "اجلس واقرأ شيئًا جديدًا.",
    English: "الإنجليزية", Translate: "ترجمة", "Hide translation": "إخفاء الترجمة", "Translating...": "جارٍ الترجمة...",
  },
};
const LanguageContext = createContext<Language>("en");
function translateText(language: Language, text: string) {
  return language === "en" ? text : TRANSLATIONS[language][text] ?? EXTRA_TRANSLATIONS[language][text] ?? text;
}
function useTranslate() {
  const language = useContext(LanguageContext);
  return (text: string) => translateText(language, text);
}
function storyTextForTranslation(text: string) {
  if (!/<(?:div|p|span|strong|b|em|i|br)\b/i.test(text)) return text;
  const parsed = new DOMParser().parseFromString(sanitizeStoryMarkup(text), "text/html");
  const appendText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    if (node.tagName === "BR") return "\n";
    const content = Array.from(node.childNodes, appendText).join("");
    return ["DIV", "P"].includes(node.tagName) ? `${content}\n` : content;
  };
  return Array.from(parsed.body.childNodes, appendText).join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function decodeTranslation(text: string) {
  const entities: Record<string, string> = {
    "&quot;": "\"",
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
  };
  return text.replace(/&quot;|&#39;|&lt;|&gt;|&amp;/g, (entity) => entities[entity]);
}
function TranslationAction({
  texts,
  language,
  children,
}: {
  texts: string[];
  language: Language;
  children: (translations: string[], languageLabel: string) => React.ReactNode;
}) {
  const t = useTranslate();
  const signature = JSON.stringify([language, texts]);
  const requestId = useRef(0);
  const [translations, setTranslations] = useState<string[] | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const languageLabel = LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? language;

  useEffect(() => {
    requestId.current += 1;
    setTranslations(null);
    setShowTranslation(false);
    setLoading(false);
    setError("");
  }, [signature]);

  if (language === "en" || !texts.some((text) => text.trim())) return null;

  const translate = async () => {
    if (translations) {
      setShowTranslation((visible) => !visible);
      return;
    }

    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, targetLanguage: language }),
      });
      const result = await response.json() as { translations?: unknown; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Translation failed. Please try again.");
      if (!Array.isArray(result.translations) || result.translations.length !== texts.length || !result.translations.every((item) => typeof item === "string")) {
        throw new Error("Translation returned an unexpected response. Please try again.");
      }
      if (requestId.current !== currentRequestId) return;
      setTranslations(result.translations.map(decodeTranslation));
      setShowTranslation(true);
    } catch (translationError) {
      if (requestId.current !== currentRequestId) return;
      setError(translationError instanceof Error ? translationError.message : "Translation failed. Please try again.");
    } finally {
      if (requestId.current === currentRequestId) setLoading(false);
    }
  };

  return (
    <div className="translation-action">
      <button
        type="button"
        className="translation-button"
        onClick={(event) => { event.stopPropagation(); void translate(); }}
        onKeyDown={(event) => event.stopPropagation()}
        disabled={loading}
      >
        <Languages size={14} /> {loading ? t("Translating...") : showTranslation ? t("Hide translation") : t("Translate")}
      </button>
      {error && <p className="translation-error" role="alert">{error}</p>}
      {translations && showTranslation && children(translations, languageLabel)}
    </div>
  );
}
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

function renderStoryText(text: string, onMention: (username: string) => void, keyPrefix: string): React.ReactNode[] {
  const mentionPattern = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{3,})/g;
  const content: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(text))) {
    const mentionStart = match.index + match[1].length;
    const username = match[2];
    if (mentionStart > lastIndex) {
      content.push(text.slice(lastIndex, mentionStart));
    } else if (match[1]) {
      content.push(match[1]);
    }
    content.push(
      <button
        key={`${keyPrefix}-mention-${mentionStart}`}
        type="button"
        className="story-mention"
        onClick={(event) => {
          event.stopPropagation();
          onMention(username.toLowerCase());
        }}
      >
        @{username}
      </button>,
    );
    lastIndex = mentionPattern.lastIndex;
  }
  if (lastIndex < text.length) content.push(text.slice(lastIndex));
  return content.length ? content : [text];
}

function storyMarkupToReact(markup: string, onMention: (username: string) => void): React.ReactNode[] {
  const parsed = new DOMParser().parseFromString(sanitizeStoryMarkup(markup), "text/html");
  const renderNode = (node: Node, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) return renderStoryText(node.textContent ?? "", onMention, key);
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
  { label: "People", icon: Search },
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
  const [language, setLanguage] = useState<Language>("en");
  const [notificationKinds, setNotificationKinds] = useState<NotificationKind[]>(NOTIFICATION_KINDS);
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
      const storedLanguage = window.localStorage.getItem("popstories-language");
      if (LANGUAGE_OPTIONS.some((option) => option.value === storedLanguage)) {
        setLanguage(storedLanguage as Language);
      }
      const storedNotificationKinds = window.localStorage.getItem("popstories-notification-kinds");
      if (storedNotificationKinds) {
        const parsedKinds: unknown = JSON.parse(storedNotificationKinds);
        if (Array.isArray(parsedKinds) && parsedKinds.every((kind) => NOTIFICATION_KINDS.includes(kind))) {
          setNotificationKinds(parsedKinds);
        }
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
  useEffect(() => {
    if (!themePreferenceLoaded) return;
    try {
      window.localStorage.setItem("popstories-language", language);
      window.localStorage.setItem("popstories-notification-kinds", JSON.stringify(notificationKinds));
    } catch (error) {
      console.error("Could not save language or notification preferences.", error);
    }
  }, [language, notificationKinds, themePreferenceLoaded]);
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
    const { data: likeCounts, error: likeCountsError } = await supabase.rpc(
      "get_public_story_like_counts",
      { p_story_ids: loaded.map((story) => story.id) },
    );
    if (likeCountsError) {
      console.error("Could not load story like counts.", likeCountsError);
    }
    const likeCountByStoryId = new Map<string, number>(
      (likeCounts ?? []).map((row: { story_id: string; like_count: number }) => [
        row.story_id,
        Number(row.like_count),
      ] as const),
    );
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
        likes: likeCountByStoryId.get(story.id) ?? story.likes?.[0]?.count ?? 0,
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

  const t = (text: string) => translateText(language, text);
  return (
    <LanguageContext.Provider value={language}>
    <div lang={language} dir={language === "ar" ? "rtl" : "ltr"} className={`app-shell ${theme === "dark" ? "dark-mode" : ""} navigation-${mobileNavigation}`}>
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            {siteImageUrl ? <img src={siteImageUrl} alt="" /> : <Coffee size={19} />}
          </div>
          <span>Flip Stories</span>
          <button
            className="sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label={t("Close menu")}
          >
            <X size={18} />
          </button>
        </div>
        <button className="profile-mini" onClick={() => {
          setMenuOpen(false);
          if (user) {
            setView("Settings");
          } else {
            setAuthMode("login");
            setAuthOpen(true);
          }
        }}>
          <div className="avatar avatar-plum">
            {user ? (user.email?.[0] ?? "U").toUpperCase() : "NS"}
          </div>
          <div>
            <strong>{user ? user.email : "Sign in to Flip Stories"}</strong>
            <span>{t(user ? "Account settings" : "General settings")}</span>
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
              <span>{t(label)}</span>
              {label === "Following" && <span className="nav-count">{following.length}</span>}
            </button>
          ))}
        </nav>
        <div className="nav-section-label">{t("Your space")}</div>
        <nav className="main-nav">
          <button
            className={`nav-item ${view === "Write" ? "active" : ""}`}
            onClick={() => {
              setView("Write");
              setMenuOpen(false);
            }}
          >
            <PenLine size={18} />
            <span>{t("Write a story")}</span>
          </button>
          <button
            className="nav-item"
            onClick={() => { setView("Shelf"); setMenuOpen(false); }}
          >
            <Bookmark size={18} />
            <span>{t("My shelf")}</span>
          </button>
          <button className={`nav-item ${view === "Settings" ? "active" : ""}`} onClick={() => { setView("Settings"); setMenuOpen(false); }}>
            <Settings2 size={18} />
            <span>{t("Settings")}</span>
          </button>
          {user?.id === ADMIN_USER_ID && <button className={`nav-item ${view === "Admin" ? "active" : ""}`} onClick={() => { setView("Admin"); setMenuOpen(false); }}><BarChart3 size={18} /><span>{t("Admin panel")}</span></button>}
          <a className="nav-item" href="/donate" aria-label="Donate with Litecoin">
            <Heart size={18} />
            <span>Donate</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={17} />
            <p>
              <strong>{t("Small stories matter.")}</strong>
              <br />
              {t("Make room for yours.")}
            </p>
          </div>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label={t("Close menu")}
        />
      )}
      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("Toggle menu")}
            aria-expanded={menuOpen}
          >
            <Menu size={21} />
          </button>
          <div className="crumb">
            <span>{t("Library")}</span>
            <ChevronRight size={14} />
            <strong>{t(view)}</strong>
          </div>
          <div className="top-actions">
            <a
              className="discord-invite-link"
              href="https://discord.gg/2YJbb4Vrmb"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} />
              <span>{t("Join Discord")}</span>
            </a>
            <button
              className="icon-button notification-button"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label={t("Notifications")}
            >
              <Bell size={18} />
              <span />
            </button>
            {notificationsOpen && <NotificationPanel user={user} selectedKinds={notificationKinds} />}
            <button className="avatar avatar-plum avatar-small" onClick={() => {
              if (user) {
                setView("Settings");
              } else {
                setAuthMode("login");
                setAuthOpen(true);
              }
            }} aria-label={t(user ? "Open settings" : "Sign in")}>{user?.email?.[0]?.toUpperCase() ?? "NS"}</button>
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
        {view === "People" && (
          <PeopleDiscovery
            user={user}
            following={following}
            onAuthor={(username) => { setPublicProfileUsername(username); setView("PublicProfile"); }}
            onFollowUpdated={() => refreshFollowingState(user?.id ?? null)}
            onSignIn={() => { setAuthMode("login"); setAuthOpen(true); }}
            notify={notify}
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
        {view === "Settings" && <SettingsView user={user} theme={theme} setTheme={setTheme} mobileNavigation={mobileNavigation} setMobileNavigation={setMobileNavigation} language={language} setLanguage={setLanguage} notificationKinds={notificationKinds} setNotificationKinds={setNotificationKinds} onSignOut={handleSignOut} onDeleted={handleAccountDeleted} onSaved={async () => { await loadStories(); setView("Discover"); }} />}
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
          { label: "People", icon: Search, view: "People" },
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
              <span>{t(label)}</span>
              {label === "Following" && <small>{following.length}</small>}
            </button>
          );
        })}
        <a href="/donate" aria-label="Donate with Litecoin">
          <Heart size={18} />
          <span>Donate</span>
        </a>
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
          onMention={(username) => { setReadingStory(null); setPublicProfileUsername(username); setView("PublicProfile"); }}
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
          onResetComplete={() => { setAuthOpen(false); notify("Your password has been reset."); }}
          onClose={() => setAuthOpen(false)}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={16} /> {toast}
        </div>
      )}
    </div>
    </LanguageContext.Provider>
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
  const t = useTranslate();
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [storyFilter, setStoryFilter] = useState("all");

  if (!stories.length) {
    return (
      <section className="content-wrap empty-feed">
        <p className="eyebrow"><BookOpen size={14} /> {t("The reading room")}</p>
        <h1>{t("There are no published stories")} <em>{t("yet.")}</em></h1>
        <p className="subtitle">{t("Be the first person to leave something kind on the table.")}</p>
        <button className="primary-button" onClick={() => setView("Write")}><PenLine size={17} /> {t("Write the first story")}</button>
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
            {t("A quiet place for")} <em>{t("good stories.")}</em>
          </h1>
          <p className="subtitle">
            {t("Pull up a chair. There’s something new to read.")}
          </p>
        </div>
        <button className="primary-button" onClick={() => setView("Write")}>
          <PenLine size={17} /> {t("Write a story")}
        </button>
      </div>
      <div className="section-heading">
        <div>
          <span className="section-kicker">{t("The reading room")}</span>
          <h2>{t("Stories from the community")}</h2>
        </div>
        <button
          className="text-button muted-button"
          onClick={() => setView("Following")}
        >
          {t("View all")} <ChevronRight size={15} />
        </button>
      </div>
      <div className="discover-filters">
        <label className="discover-search">
          <Search size={17} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("Search story titles")}
            aria-label={t("Search story titles")}
          />
        </label>
        <label className="discover-genre-filter">
          <span>{t("Genre")}</span>
          <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} aria-label={t("Filter stories by genre")}>
            <option value="all">{t("All genres")}</option>
            {GENRES.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
          </select>
        </label>
        <label className="discover-genre-filter">
          <span>{t("Browse")}</span>
          <select value={storyFilter} onChange={(event) => setStoryFilter(event.target.value)} aria-label={t("Filter stories by popularity and length")}>
            <option value="all">{t("All stories")}</option>
            <option value="popular">{t("Popular")}</option>
            <option value="hot">{t("Hot")}</option>
            <option value="recent">{t("New / Recent")}</option>
            <option value="short">{t("Short read")}</option>
            <option value="long">{t("Long read")}</option>
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
            onMention={onAuthor}
          />
        ))}
      </div>
      {!filteredStories.length && (
        <div className="discover-empty-filter">
          <Search size={20} />
          <p>{t("No stories match that search.")}</p>
        </div>
      )}
    </section>
  );
}

type DiscoveryProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
};

function PeopleDiscovery({
  user,
  following,
  onAuthor,
  onFollowUpdated,
  onSignIn,
  notify,
}: {
  user: User | null;
  following: string[];
  onAuthor: (username: string) => void;
  onFollowUpdated: () => Promise<void>;
  onSignIn: () => void;
  notify: (message: string) => void;
}) {
  const t = useTranslate();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadProfiles = async () => {
      setLoading(true);
      setError("");
      const query = searchQuery.trim().replace(/^@+/, "");
      const requests = query
        ? [
            supabase.from("profiles").select("id,username,display_name,bio,avatar_url").ilike("username", `%${query}%`).order("username").limit(50),
            supabase.from("profiles").select("id,username,display_name,bio,avatar_url").ilike("display_name", `%${query}%`).order("display_name").limit(50),
          ]
        : [
            supabase.from("profiles").select("id,username,display_name,bio,avatar_url").order("display_name").limit(50),
          ];
      const results = await Promise.all(requests);
      const resultError = results.find((result) => result.error)?.error;
      if (!active) return;
      if (resultError) {
        console.error("Could not load people discovery profiles.", resultError);
        setError(`Could not load profiles: ${resultError.message}`);
        setProfiles([]);
        setLoading(false);
        return;
      }
      const profileById = new Map<string, DiscoveryProfile>();
      results.forEach((result) => {
        (result.data ?? []).forEach((profile: DiscoveryProfile) => {
          if (profile.id !== user?.id) profileById.set(profile.id, profile);
        });
      });
      setProfiles([...profileById.values()]);
      setLoading(false);
    };
    void loadProfiles();
    return () => { active = false; };
  }, [searchQuery, user?.id]);

  const toggleFollow = async (profile: DiscoveryProfile) => {
    if (!user) {
      onSignIn();
      return;
    }
    const isFollowing = following.includes(profile.id);
    setFollowLoadingId(profile.id);
    const result = isFollowing
      ? await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id)
      : await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
    if (result.error) {
      notify(result.error.message);
      setFollowLoadingId(null);
      return;
    }
    await onFollowUpdated();
    setFollowLoadingId(null);
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  return (
    <section className="content-wrap people-discovery">
      <div className="welcome-row">
        <div>
          <p className="eyebrow"><Users size={14} /> {t("The community")}</p>
          <h1>{t("Find your")} <em>{t("people.")}</em></h1>
          <p className="subtitle">{t("Discover writers, meet new voices, and find your next favorite storyteller.")}</p>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <span className="section-kicker">People discovery</span>
          <h2>Readers and writers</h2>
        </div>
        <span className="shelf-section-count">{profiles.length} {t("people")}</span>
      </div>
      <form className="people-search-form" onSubmit={submitSearch}>
        <label className="discover-search">
          <Search size={17} />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("Search by name or @username")}
            aria-label={t("Search people by name or username")}
          />
        </label>
        <button type="submit" className="primary-button"><Search size={16} /> {t("Search people")}</button>
      </form>
      {loading ? (
        <p className="subtitle people-discovery-state">{t("Finding people...")}</p>
      ) : error ? (
        <p className="profile-error people-discovery-state" role="alert">{error}</p>
      ) : profiles.length ? (
        <div className="discovered-people-grid">
          {profiles.map((profile) => {
            const isFollowing = following.includes(profile.id);
            return (
              <article className="discovered-person-card" key={profile.id}>
                <button type="button" className="discovered-person-main" onClick={() => onAuthor(profile.username)}>
                  <span className="discovered-person-avatar">
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" />
                      : profile.display_name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="discovered-person-copy">
                    <strong>{profile.display_name}</strong>
                    <small>@{profile.username}</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
                <p>{profile.bio?.trim() || t("A Flip Stories community member.")}</p>
                <button
                  type="button"
                  className={`follow-chip ${isFollowing ? "following" : ""}`}
                  onClick={() => void toggleFollow(profile)}
                  disabled={followLoadingId === profile.id}
                >
                  {followLoadingId === profile.id ? t("Updating...") : isFollowing ? t("Following") : t("Follow")}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="discover-empty-filter people-discovery-state">
          <Users size={20} />
          <p>{searchQuery ? `${t("No people found for")} “${searchQuery}”.` : t("No profiles to discover yet.")}</p>
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
        <button className="text-button" onClick={() => setView("People")}>
          Discover people <ChevronRight size={15} />
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
            onMention={onAuthor}
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
  onMention,
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
  onMention: (username: string) => void;
}) {
  const language = useContext(LanguageContext);
  const t = useTranslate();
  const translationTexts = [story.title, storyTextForTranslation(story.excerpt)].filter((text) => text.trim());
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
        {language !== "en" && <span className="translation-language-label original-language-label">{t("English")}</span>}
        <h3>{story.title}</h3>
        <p>{renderStoryText(story.excerpt, onMention, `excerpt-${story.id}`)}</p>
        <TranslationAction texts={translationTexts} language={language}>
          {(translated, languageLabel) => (
            <div className="translation-result story-card-translation-result">
              <span className="translation-slash" aria-hidden="true">/</span>
              <span className="translation-language-label">{languageLabel}</span>
              <h3>{translated[0]}</h3>
              {translated[1] && <p>{translated[1]}</p>}
            </div>
          )}
        </TranslationAction>
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

function SettingsView({ user, theme, setTheme, mobileNavigation, setMobileNavigation, language, setLanguage, notificationKinds, setNotificationKinds, onSignOut, onDeleted, onSaved }: { user: User | null; theme: "light" | "dark"; setTheme: (theme: "light" | "dark") => void; mobileNavigation: MobileNavigation; setMobileNavigation: (navigation: MobileNavigation) => void; language: Language; setLanguage: (language: Language) => void; notificationKinds: NotificationKind[]; setNotificationKinds: (kinds: NotificationKind[]) => void; onSignOut: () => Promise<void>; onDeleted: () => Promise<void>; onSaved: () => Promise<void> }) {
  const t = useTranslate();
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
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
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
  const verifyCurrentPassword = async (password: string) => {
    if (!user?.email) {
      setSecurityError("This account does not have an email and password sign-in method.");
      return false;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (error) {
      setSecurityError(error.message);
      return false;
    }
    return true;
  };
  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSecurityError("");
    setSecurityMessage("");
    if (newPassword !== confirmNewPassword) {
      setSecurityError("The new passwords do not match.");
      return;
    }
    setSecurityLoading(true);
    try {
      if (!await verifyCurrentPassword(currentPassword)) {
        setSecurityLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setSecurityError(error.message);
        setSecurityLoading(false);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSecurityMessage("Your password has been updated.");
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Password update failed. Please try again.");
    }
    setSecurityLoading(false);
  };
  const requestEmailChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSecurityError("");
    setSecurityMessage("");
    if (!user?.email) {
      setSecurityError("This account does not have an email and password sign-in method.");
      return;
    }
    if (newEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      setSecurityError("Enter a different email address.");
      return;
    }
    setSecurityLoading(true);
    try {
      if (!await verifyCurrentPassword(emailCurrentPassword)) {
        setSecurityLoading(false);
        return;
      }
      const normalizedEmail = newEmail.trim().toLowerCase();
      const { error } = await supabase.auth.updateUser({ email: normalizedEmail });
      if (error) {
        setSecurityError(error.message);
        setSecurityLoading(false);
        return;
      }
      setNewEmail(normalizedEmail);
      setEmailCode("");
      setEmailCodeSent(true);
      setEmailCurrentPassword("");
      setSecurityMessage(`A confirmation code was sent to ${normalizedEmail}.`);
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Email change could not be started.");
    }
    setSecurityLoading(false);
  };
  const confirmEmailChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSecurityError("");
    setSecurityMessage("");
    setSecurityLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: newEmail,
      token: emailCode.trim(),
      type: "email_change",
    });
    if (error) {
      setSecurityError(error.message);
      setSecurityLoading(false);
      return;
    }
    setEmailCodeSent(false);
    setEmailCode("");
    setNewEmail("");
    setSecurityMessage("Your email address has been updated.");
    setSecurityLoading(false);
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
          <p className="eyebrow"><Settings2 size={14} /> {t("Preferences")}</p>
          <h1>{t("Settings")}</h1>
          <p className="subtitle">{t("Make Flip Stories feel right for you.")}</p>
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
        <Settings2 size={16} /> {t("General")}
        </button>
        {user && (
          <button type="button" role="tab" aria-selected={section === "profile"} className={section === "profile" ? "active" : ""} onClick={() => setSection("profile")}>
            <Users size={16} /> {t("Profile")}
          </button>
        )}
      </div>
      {section === "general" && (
        <section className="settings-section" role="tabpanel" aria-label="General settings">
          <div className="settings-section-heading">
            <div><span className="section-kicker">{t("Preferences")}</span><h2>{t("General")}</h2></div>
            <p>{t("Choose how the reading room looks and works on this device.")}</p>
          </div>
          <div className="settings-option">
            <span className="settings-option-icon">{theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}</span>
            <span className="settings-option-copy"><strong>{t("Appearance")}</strong><small>{t("Choose a light or dark reading room.")}</small></span>
            <span className="appearance-choice">
              <button type="button" className={theme === "light" ? "selected" : ""} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
                <Sun size={15} /> {t("Light")}
              </button>
              <button type="button" className={theme === "dark" ? "selected" : ""} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
                <Moon size={15} /> {t("Dark")}
              </button>
            </span>
          </div>
          <div className="settings-option settings-navigation-option">
            <span className="settings-option-icon"><Menu size={18} /></span>
            <span className="settings-option-copy"><strong>{t("Mobile navigation")}</strong><small>{t("Choose how to open the menu on smaller screens.")}</small></span>
            <span className="navigation-choice" role="group" aria-label="Mobile navigation style">
              <button type="button" className={mobileNavigation === "bottom" ? "selected" : ""} aria-pressed={mobileNavigation === "bottom"} onClick={() => setMobileNavigation("bottom")}>
                <ChevronDown size={15} /> {t("Bottom bar")}
              </button>
              <button type="button" className={mobileNavigation === "left" ? "selected" : ""} aria-pressed={mobileNavigation === "left"} onClick={() => setMobileNavigation("left")}>
                <ChevronLeft size={15} /> {t("Left")}
              </button>
              <button type="button" className={mobileNavigation === "right" ? "selected" : ""} aria-pressed={mobileNavigation === "right"} onClick={() => setMobileNavigation("right")}>
                <ChevronRight size={15} /> {t("Right")}
              </button>
            </span>
          </div>
          <div className="settings-option">
            <span className="settings-option-icon"><Languages size={18} /></span>
            <span className="settings-option-copy"><strong>{t("Language")}</strong><small>{t("Choose the language for the app interface.")}</small></span>
            <label className="settings-select-wrap">
              <span className="sr-only">{t("Language")}</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
                {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <div className="settings-option settings-notification-option">
            <span className="settings-option-icon"><Bell size={18} /></span>
            <span className="settings-option-copy"><strong>{t("Notification preferences")}</strong><small>{t("Choose which activity appears in your notifications.")}</small></span>
            <details className="notification-preference-dropdown">
              <summary aria-label={t("Notification preferences")}>{notificationSelectionLabel(notificationKinds, t)} <ChevronDown size={14} /></summary>
              <div className="notification-preference-menu">
                {NOTIFICATION_KINDS.map((kind) => (
                  <label key={kind}>
                    <input
                      type="checkbox"
                      checked={notificationKinds.includes(kind)}
                      onChange={(event) => setNotificationKinds(event.target.checked
                        ? [...notificationKinds, kind]
                        : notificationKinds.filter((selected) => selected !== kind))}
                    />
                    <span>{t(notificationKindLabel(kind))}</span>
                  </label>
                ))}
              </div>
            </details>
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
          <section className="account-security-section" aria-labelledby="account-security-title">
            <div className="settings-section-heading">
              <div><span className="section-kicker">Sign-in details</span><h2 id="account-security-title">Account security</h2></div>
              <p>Confirm changes with your current password.</p>
            </div>
            <form className="profile-form account-security-form" onSubmit={changePassword}>
              <h3>Change password</h3>
              <label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
              <label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} required /></label>
              <label>Confirm new password<input type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} minLength={6} required /></label>
              <button className="publish-button" type="submit" disabled={securityLoading}>{securityLoading ? "Updating..." : "Update password"}</button>
            </form>
            <form className="profile-form account-security-form" onSubmit={emailCodeSent ? confirmEmailChange : requestEmailChange}>
              <h3>Change email</h3>
              <p className="profile-hint">Current email: {user.email ?? "Not available"}</p>
              {emailCodeSent ? (
                <>
                  <p className="profile-hint">Enter the confirmation code sent to {newEmail}.</p>
                  <label>Email confirmation code<input inputMode="numeric" autoComplete="one-time-code" value={emailCode} onChange={(event) => setEmailCode(event.target.value)} required /></label>
                  <button className="publish-button" type="submit" disabled={securityLoading}>{securityLoading ? "Verifying..." : "Confirm new email"}</button>
                  <button className="text-button" type="button" onClick={() => { setEmailCodeSent(false); setEmailCode(""); setSecurityError(""); setSecurityMessage(""); }}>Use a different email</button>
                </>
              ) : (
                <>
                  <label>Current password<input type="password" autoComplete="current-password" value={emailCurrentPassword} onChange={(event) => setEmailCurrentPassword(event.target.value)} required /></label>
                  <label>New email address<input type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required /></label>
                  <button className="publish-button" type="submit" disabled={securityLoading}>{securityLoading ? "Sending code..." : "Send confirmation code"}</button>
                </>
              )}
            </form>
            {securityError && <p className="profile-error" role="alert">{securityError}</p>}
            {securityMessage && <p className="security-success" role="status">{securityMessage}</p>}
          </section>
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
      const profileStories = data ?? [];
      const { data: likeCounts, error: likeCountsError } = await supabase.rpc(
        "get_public_story_like_counts",
        { p_story_ids: profileStories.map((story: { id: string }) => story.id) },
      );
      if (likeCountsError) {
        console.error("Could not load profile story like counts.", likeCountsError);
      }
      const likeCountByStoryId = new Map<string, number>(
        (likeCounts ?? []).map((row: { story_id: string; like_count: number }) => [
          row.story_id,
          Number(row.like_count),
        ] as const),
      );
      setStories(profileStories.map((story: any, index: number) => ({ id: story.id, authorId: profileRow.id, title: story.title, excerpt: story.excerpt ?? "", author: profileRow.display_name, handle: profileRow.username, initials: profileRow.display_name.slice(0, 2).toUpperCase(), category: story.category ?? "Personal essays", readTime: "5 min read", date: new Date(story.created_at).toLocaleDateString(), createdAt: story.created_at, accent: ["sage", "terracotta", "mustard"][index % 3], likes: likeCountByStoryId.get(story.id) ?? story.likes?.[0]?.count ?? 0, avatarUrl: profileRow.avatar_url ?? "" })));
      await loadFollowCounts(profileRow.id);
    };
    void load();
  }, [username, user]);
  if (!profile) return <section className="content-wrap empty-feed"><button className="text-button" onClick={onBack}><ChevronLeft size={15} /> Back</button><h1>Profile not found.</h1></section>;
  return <section className="content-wrap public-profile-wrap"><button className="text-button" onClick={onBack}><ChevronLeft size={15} /> Back to Discover</button><div className="public-profile-header">{profile.avatar_url ? <img className="public-avatar" src={profile.avatar_url} alt="" /> : <div className="avatar avatar-plum avatar-large">{profile.display_name.slice(0, 2).toUpperCase()}</div>}<div><h1>{profile.display_name}</h1><p>@{profile.username}</p>{profile.bio && <span>{profile.bio}</span>}{profile.profile_links.length ? <div className="profile-link-list">{profile.profile_links.map((link) => { const hostname = new URL(link).hostname.replace(/^www\./, ""); return <a key={link} className="profile-link" href={link} target="_blank" rel="noreferrer noopener">{hostname}</a>; })}</div> : null}</div>{user?.id !== profile.id ? <button className="primary-button" onClick={() => void toggleProfileFollow()} disabled={loadingFollow}>{loadingFollow ? "Updating..." : isFollowing ? "Following" : "Follow"}</button> : null}</div><FollowDirectory user={user} profileId={profile.id} counts={followCounts} onAuthor={onAuthor} /><div className="section-heading"><div><span className="section-kicker">Published stories</span><h2>From {profile.display_name}</h2></div></div>{stories.length ? <div className="story-list">{stories.map((story) => <StoryCard key={story.id} story={story} liked={false} saved={false} following={isFollowing} onLike={() => {}} onSave={() => {}} onFollow={() => void toggleProfileFollow()} onRead={() => onRead(story)} onAuthor={() => {}} onMention={onAuthor} />)}</div> : <p className="subtitle">No public stories yet.</p>}</section>;
}

function NotificationPanel({ user, selectedKinds }: { user: User | null; selectedKinds: NotificationKind[] }) {
  const t = useTranslate();
  const language = useContext(LanguageContext);
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
    like: t("liked your story"),
    favorite: t("favorited your story"),
    comment: t("commented on your story"),
    follow: t("started following you"),
  };
  const visibleItems = items.filter((item) => selectedKinds.includes(item.kind));

  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <strong>{t("Recent activity")}</strong>
        <span>{visibleItems.length} / 50</span>
      </div>
      {loading ? (
        <p className="notification-empty">{t("Loading activity...")}</p>
      ) : !user ? (
        <p className="notification-empty">{t("Sign in to see activity.")}</p>
      ) : loadError ? (
        <p className="notification-empty">{loadError}</p>
      ) : !visibleItems.length ? (
        <p className="notification-empty">{t(selectedKinds.length ? "No recent likes, comments, favorites, or follows." : "No types selected")}</p>
      ) : (
        <div className="notification-list">
          {visibleItems.map((item) => (
            <div className="notification-item" key={item.id}>
              <span className="notification-avatar">
                {item.actorAvatar ? <img src={item.actorAvatar} alt="" /> : item.actor.slice(0, 2).toUpperCase()}
              </span>
              <p>
                <strong>{item.actor}</strong> {descriptions[item.kind]}
                {item.storyTitle && <> <em>{item.storyTitle}</em></>}
                {item.detail && <span className="notification-detail">“{item.detail}”</span>}
                <small>{new Date(item.createdAt).toLocaleString(LOCALE_BY_LANGUAGE[language])}</small>
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
                onMention={onAuthor}
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

function FormattedStoryText({ text, onMention }: { text: string; onMention: (username: string) => void }) {
  const [richContent, setRichContent] = useState<React.ReactNode[] | null>(null);
  useEffect(() => {
    if (!/<(?:div|p|span|strong|b|em|i|br)\b/i.test(text)) {
      setRichContent(null);
      return;
    }
    setRichContent(storyMarkupToReact(text, onMention));
  }, [text]);

  if (richContent) return <>{richContent}</>;
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  return <>{paragraphs.map((paragraph, paragraphIndex) => <p key={`${paragraphIndex}-${paragraph.slice(0, 12)}`}>{paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{renderStoryText(part.slice(2, -2), onMention, `plain-${paragraphIndex}-${index}`)}</strong> : part.startsWith("*") && part.endsWith("*") ? <em key={index}>{renderStoryText(part.slice(1, -1), onMention, `plain-${paragraphIndex}-${index}`)}</em> : <span key={index}>{renderStoryText(part, onMention, `plain-${paragraphIndex}-${index}`)}</span>)}</p>)}</>;
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
  onMention,
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
  onMention: (username: string) => void;
  onShare: () => void;
  onViewError: (message: string) => void;
  setAuthMode: (mode: "login" | "signup") => void;
  setAuthOpen: (open: boolean) => void;
}) {
  const language = useContext(LanguageContext);
  const t = useTranslate();
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
          {language !== "en" && <span className="translation-language-label original-language-label">{t("English")}</span>}
          <div className="reader-body">
            <FormattedStoryText text={pages[pageIndex] ?? ""} onMention={onMention} />
          </div>
          <TranslationAction texts={[storyTextForTranslation(pages[pageIndex] ?? "")]} language={language}>
            {(translated, languageLabel) => (
              <div className="translation-result reader-translation-result">
                <span className="translation-slash" aria-hidden="true">/</span>
                <span className="translation-language-label">{languageLabel}</span>
                <p>{translated[0]}</p>
              </div>
            )}
          </TranslationAction>
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
                        <TranslationAction texts={[comment.content]} language={language}>
                          {(translated, languageLabel) => (
                            <div className="translation-result comment-translation-result">
                              <span className="translation-slash" aria-hidden="true">/</span>
                              <span className="translation-language-label">{languageLabel}</span>
                              <p>{translated[0]}</p>
                            </div>
                          )}
                        </TranslationAction>
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
  onResetComplete,
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
  onResetComplete: () => void;
  onClose: () => void;
}) {
  const [forgotPassword, setForgotPassword] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"request" | "code" | "password">("request");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const requestRecoveryCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoveryMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) {
      setRecoveryError(error.message);
      setRecoveryLoading(false);
      return;
    }
    setRecoveryStep("code");
    setRecoveryMessage("If an account exists for this email, a recovery code has been sent.");
    setRecoveryLoading(false);
  };

  const verifyRecoveryCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError("");
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: recoveryCode.trim(),
      type: "recovery",
    });
    if (error) {
      setRecoveryError(error.message);
      setRecoveryLoading(false);
      return;
    }
    setRecoveryStep("password");
    setRecoveryMessage("Code verified. Choose a new password.");
    setRecoveryLoading(false);
  };

  const saveRecoveredPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryError("");
    if (recoveryPassword !== recoveryPasswordConfirm) {
      setRecoveryError("The new passwords do not match.");
      return;
    }
    setRecoveryLoading(true);
    const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
    if (error) {
      setRecoveryError(error.message);
      setRecoveryLoading(false);
      return;
    }
    onResetComplete();
  };

  const startForgotPassword = () => {
    setForgotPassword(true);
    setRecoveryStep("request");
    setRecoveryCode("");
    setRecoveryPassword("");
    setRecoveryPasswordConfirm("");
    setRecoveryError("");
    setRecoveryMessage("");
  };

  const returnToLogin = () => {
    setForgotPassword(false);
    setRecoveryError("");
    setRecoveryMessage("");
    setRecoveryCode("");
    setRecoveryPassword("");
    setRecoveryPasswordConfirm("");
  };

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
        <h2>{forgotPassword ? "Reset your password." : mode === "login" ? "Welcome back." : "Make room for your story."}</h2>
        <p className="auth-intro">
          {forgotPassword
            ? recoveryStep === "request"
              ? "Enter your account email and we’ll send a recovery code."
              : recoveryStep === "code"
                ? `Enter the recovery code sent to ${email}.`
                : "Choose a new password for your account."
            : mode === "login"
            ? "Your little corner of the reading room is waiting."
            : "Create an account to write, save, and follow."}
        </p>
        {forgotPassword ? (
          <form
            onSubmit={recoveryStep === "request" ? requestRecoveryCode : recoveryStep === "code" ? verifyRecoveryCode : saveRecoveredPassword}
            className="auth-form"
          >
            {recoveryStep === "request" && (
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />
              </label>
            )}
            {recoveryStep === "code" && (
              <>
                <label>
                  Recovery code
                  <input inputMode="numeric" autoComplete="one-time-code" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
                </label>
                <button className="text-button auth-inline-button" type="button" onClick={() => setRecoveryStep("request")}>Use a different email or request another code</button>
              </>
            )}
            {recoveryStep === "password" && (
              <>
                <label>
                  New password
                  <input type="password" value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} minLength={6} required autoComplete="new-password" />
                </label>
                <label>
                  Confirm new password
                  <input type="password" value={recoveryPasswordConfirm} onChange={(event) => setRecoveryPasswordConfirm(event.target.value)} minLength={6} required autoComplete="new-password" />
                </label>
              </>
            )}
            {recoveryError && <p className="auth-error" role="alert">{recoveryError}</p>}
            {recoveryMessage && <p className="auth-success" role="status">{recoveryMessage}</p>}
            <button className="publish-button auth-submit" disabled={recoveryLoading}>
              {recoveryLoading ? "Please wait..." : recoveryStep === "request" ? "Send recovery code" : recoveryStep === "code" ? "Verify code" : "Save new password"}
            </button>
            <button className="text-button auth-inline-button" type="button" onClick={returnToLogin}>Back to log in</button>
          </form>
        ) : (
          <>
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
              {mode === "login" && <button className="text-button auth-inline-button" type="button" onClick={startForgotPassword}>Forgot password?</button>}
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
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                }}
              >
                {" "}
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
