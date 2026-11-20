import { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Bell, 
  Calendar, 
  FileText, 
  Home, 
  LogOut, 
  Menu, 
  Network, 
  HeartHandshake,
  Target,
  Search, 
  User as UserIcon,
  Contact,
  UserCheck,
  ChevronRight,
  Copy,
  Mail,
  CheckCircle2,
  BookOpen,
  X,
  FolderOpen,
  Video,
  MapPin,
  BarChart3,
  Building2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../features/auth/AuthContext';
import AppBreadcrumb, { BreadcrumbProvider } from './AppBreadcrumb';
import QuickWhatsAppModal, { WhatsAppSvg } from '../communication/QuickWhatsAppModal';
import QuickEmailModal from '../communication/QuickEmailModal';
import { ImlSymbol } from '../common/ImlLogo';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Écoute des soumissions de formulaires publics (inter-onglets ou intra-navigateur)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'iml_last_submission') {
        qc.invalidateQueries({ queryKey: ['pending-applications-alert'] });
        qc.invalidateQueries({ queryKey: ['pending-room-bookings-alert'] });
        qc.invalidateQueries({ queryKey: ['contact-messages-alert'] });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [qc]);

  // Modales et actions des boutons flottants globaux (WhatsApp, E-mail, Support)
  const [isQuickWhatsAppOpen, setIsQuickWhatsAppOpen] = useState(false);
  const [isQuickEmailOpen, setIsQuickEmailOpen] = useState(false);
  const [isGlobalNotesOpen, setIsGlobalNotesOpen] = useState(false);

  // Détection de l'ouverture du tiroir de calendrier pour décaler les boutons flottants
  const [isCalendarDrawerOpen, setIsCalendarDrawerOpen] = useState(false);

  useEffect(() => {
    const handleCalendarToggle = (e: any) => {
      setIsCalendarDrawerOpen(Boolean(e.detail?.open));
    };
    window.addEventListener('calendar-drawer-changed', handleCalendarToggle);
    return () => window.removeEventListener('calendar-drawer-changed', handleCalendarToggle);
  }, []);

  useEffect(() => {
    setIsCalendarDrawerOpen(false);
  }, [location.pathname]);

  const [globalNote, setGlobalNote] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('iml_global_quick_scratchpad') || '';
    }
    return '';
  });

  const handleSaveGlobalNote = (val: string) => {
    setGlobalNote(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('iml_global_quick_scratchpad', val);
    }
  };

  // Formatage de la date des notifications (ex: Aujourd'hui à 14:30, Hier à 18:20)
  const formatNotificationDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'Récent';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Récent';

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfToday.getDate() - 1);

    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (date >= startOfToday) {
      return `Aujourd'hui, ${timeStr}`;
    } else if (date >= startOfYesterday) {
      return `Hier, ${timeStr}`;
    } else {
      const day = date.getDate();
      const month = date.toLocaleDateString('fr-FR', { month: 'short' });
      return `${day} ${month}, ${timeStr}`;
    }
  };
  
  // État du menu de notifications (Cloche) et alertes
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Mémorisation des alertes de candidatures déjà consultées/fermées
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('iml_read_application_alerts') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const isCoach = !!(user && (
    user.role === 'COACH' || 
    user.roleLabel?.toLowerCase().includes('coach') || 
    user.email?.toLowerCase().includes('coach')
  ));

  // Mémorisation des alertes coach (bénéficiaires affectés) consultées
  const [readCoachAlertIds, setReadCoachAlertIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('iml_read_coach_alerts') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const markCoachAlertAsRead = (apptId: string) => {
    setReadCoachAlertIds((prev) => {
      if (prev.includes(apptId)) return prev;
      const next = [...prev, apptId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_read_coach_alerts', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const [readNoteAlertIds, setReadNoteAlertIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('iml_read_note_alerts') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const markNoteAlertAsRead = (noteId: string) => {
    setReadNoteAlertIds((prev) => {
      if (prev.includes(noteId)) return prev;
      const next = [...prev, noteId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_read_note_alerts', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const markAlertAsRead = (appId: string) => {
    setReadAlertIds((prev) => {
      if (prev.includes(appId)) return prev;
      const next = [...prev, appId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_read_application_alerts', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const [readRoomAlertIds, setReadRoomAlertIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('iml_read_room_alerts') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const markRoomAlertAsRead = (bookingId: string) => {
    setReadRoomAlertIds((prev) => {
      if (prev.includes(bookingId)) return prev;
      const next = [...prev, bookingId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_read_room_alerts', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const [readContactAlertIds, setReadContactAlertIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('iml_read_contact_alerts') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const markContactAlertAsRead = (contactId: string) => {
    setReadContactAlertIds((prev) => {
      if (prev.includes(contactId)) return prev;
      const next = [...prev, contactId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_read_contact_alerts', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const [readBeneficiaryAlertIds, setReadBeneficiaryAlertIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('iml_read_beneficiary_alerts') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const markBeneficiaryAlertAsRead = (benId: string) => {
    setReadBeneficiaryAlertIds((prev) => {
      if (prev.includes(benId)) return prev;
      const next = [...prev, benId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_read_beneficiary_alerts', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Récupérer les nouvelles réservations de salle pour notifier l'équipe et la direction
  const { data: pendingRoomBookingsRes } = useQuery({
    queryKey: ['pending-room-bookings-alert'],
    queryFn: () =>
      api<{ items: any[] } | any[]>('/rooms/bookings?status=EN_ATTENTE')
        .then((res) => (Array.isArray(res) ? res : res?.items || []))
        .catch(() => []),
    refetchInterval: 8_000,
    enabled: !isCoach,
  });

  // Récupérer les nouveaux bénéficiaires créés / inscrits (accessible à l'Agent et à la Direction)
  const { data: recentBeneficiariesRes } = useQuery({
    queryKey: ['recent-beneficiaries-alert'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=30').catch(() => ({ items: [], total: 0 })),
    refetchInterval: 8_000,
    enabled: !isCoach,
  });

  const allBeneficiaries = recentBeneficiariesRes?.items || [];
  const recentBeneficiaries = allBeneficiaries.filter((b: any) => {
    const d = new Date(b.createdAt);
    return !isNaN(d.getTime()) && d.getTime() >= new Date('2026-11-12T00:00:00Z').getTime();
  });
  const unreadBeneficiaries = recentBeneficiaries.filter((b: any) => !readBeneficiaryAlertIds.includes(b.id));

  // Récupérer les nouvelles candidatures (accessible à l'Agent et à la Direction)
  const { data: pendingAppsData } = useQuery({
    queryKey: ['pending-applications-alert'],
    queryFn: () => api<{ items: any[]; total: number }>('/applications?pageSize=30').catch(() => ({ items: [], total: 0 })),
    refetchInterval: 8_000,
    enabled: !isCoach,
  });

  const isDateToday = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  // Récupérer les derniers comptes-rendus rédigés par les coachs/experts pour notifier l'agent
  const { data: recentNotesData } = useQuery({
    queryKey: ['recent-notes-alert'],
    queryFn: () => api<{ items: any[] }>('/beneficiaries/recent-notes').then(r => r.items || []).catch(() => []),
    refetchInterval: 8_000,
    enabled: !isCoach,
  });

  // Récupérer les séances et bénéficiaires affectés au coach par l'agent de planification
  const { data: coachApptsData } = useQuery({
    queryKey: ['coach-notifications-appts', user?.id],
    queryFn: () => api<{ items: any[] }>('/appointments').then(r => r.items || []).catch(() => []),
    refetchInterval: 8_000,
    enabled: isCoach,
  });

  const coachAppts = coachApptsData || [];
  const unreadCoachAppts = coachAppts.filter((a: any) => !readCoachAlertIds.includes(a.id));

  const pendingRoomBookings = Array.isArray(pendingRoomBookingsRes)
    ? pendingRoomBookingsRes
    : (pendingRoomBookingsRes as any)?.items || [];
  const unreadRoomBookings = pendingRoomBookings.filter((b: any) => !readRoomAlertIds.includes(b.id));

  // Filtrer uniquement les anciens dossiers de démonstration locaux (créés avant le 12 nov 2026).
  // NB : on ne filtre plus par numéro de séquence, sinon les vraies candidatures en production (n°1, 2, 3...) étaient masquées.
  const isSeedApp = (a: any) => {
    const d = new Date(a.createdAt || a.submittedAt);
    return !isNaN(d.getTime()) && d.getTime() < new Date('2026-11-12T00:00:00Z').getTime();
  };

  // Candidatures éligibles à l'alerte : réelles nouvelles candidatures reçues
  const pendingApps = (pendingAppsData?.items || []).filter((a: any) => 
    !isSeedApp(a) && (a.status === 'SOUMISE' || a.status === 'EN_ATTENTE' || a.status === 'BROUILLON' || a.status === 'EN_COURS_EXAMEN' || isDateToday(a.submittedAt || a.createdAt))
  );
  const unreadApps = pendingApps.filter((a: any) => !readAlertIds.includes(a.id));

  // Les candidatures d'aujourd'hui doivent obligatoirement être affichées tout en haut
  const todayApps = unreadApps
    .filter((a: any) => isDateToday(a.submittedAt || a.createdAt))
    .sort((a: any, b: any) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime());

  const olderApps = unreadApps
    .filter((a: any) => !isDateToday(a.submittedAt || a.createdAt))
    .sort((a: any, b: any) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime());

  const recentNotes = recentNotesData || [];
  // Filtrer les comptes-rendus non consultés (et ignorer les notes rédigées par l'agent lui-même)
  const unreadNotes = recentNotes.filter((n: any) => !readNoteAlertIds.includes(n.id) && n.author?.id !== user?.id);

  // Récupérer les nouveaux messages de contact reçus depuis le formulaire public du site web
  const { data: contactsRes } = useQuery({
    queryKey: ['contact-messages-alert'],
    queryFn: () => api<{ items: any[]; total: number; unreadCount: number }>('/contacts').catch(() => ({ items: [], total: 0, unreadCount: 0 })),
    refetchInterval: 8_000,
    enabled: !isCoach,
  });

  const contactItems = contactsRes?.items || [];
  const unreadContacts = contactItems.filter((c: any) => c.status === 'NOUVEAU' && !readContactAlertIds.includes(c.id));

  const alertCount = isCoach
    ? unreadCoachAppts.length
    : (unreadApps.length + unreadBeneficiaries.length + unreadNotes.length + unreadRoomBookings.length + unreadContacts.length);

  const markAllAlertsAsRead = () => {
    if (isCoach) {
      const allIds = coachAppts.map((a: any) => a.id);
      const combined = Array.from(new Set([...readCoachAlertIds, ...allIds]));
      setReadCoachAlertIds(combined);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_read_coach_alerts', JSON.stringify(combined));
        } catch {}
      }
      return;
    }

    const allAppIds = pendingApps.map((a: any) => a.id);
    const combinedApps = Array.from(new Set([...readAlertIds, ...allAppIds]));
    setReadAlertIds(combinedApps);

    const allBenIds = recentBeneficiaries.map((b: any) => b.id);
    const combinedBens = Array.from(new Set([...readBeneficiaryAlertIds, ...allBenIds]));
    setReadBeneficiaryAlertIds(combinedBens);

    const allNoteIds = recentNotes.map((n: any) => n.id);
    const combinedNotes = Array.from(new Set([...readNoteAlertIds, ...allNoteIds]));
    setReadNoteAlertIds(combinedNotes);

    const allRoomIds = pendingRoomBookings.map((b: any) => b.id);
    const combinedRooms = Array.from(new Set([...readRoomAlertIds, ...allRoomIds]));
    setReadRoomAlertIds(combinedRooms);

    const allContactIds = contactItems.map((c: any) => c.id);
    const combinedContacts = Array.from(new Set([...readContactAlertIds, ...allContactIds]));
    setReadContactAlertIds(combinedContacts);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('iml_read_application_alerts', JSON.stringify(combinedApps));
        localStorage.setItem('iml_read_beneficiary_alerts', JSON.stringify(combinedBens));
        localStorage.setItem('iml_read_note_alerts', JSON.stringify(combinedNotes));
        localStorage.setItem('iml_read_room_alerts', JSON.stringify(combinedRooms));
        localStorage.setItem('iml_read_contact_alerts', JSON.stringify(combinedContacts));
      } catch {}
    }
  };

  // Petite notification d'accusé de réception pour l'agent de planification (JAMAIS POUR LE COACH)
  const [receiptToast, setReceiptToast] = useState<{
    appointmentId?: string;
    coachName: string;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    datetime: string;
    durationMinutes: number;
    sessionType: 'video' | 'in_person';
    locationOrUrl: string;
    status?: 'delivered' | 'simulated' | 'failed';
    errorMessage?: string;
    whatsAppUrl?: string | null;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleAppointmentScheduled = (e: any) => {
      // Côté coach : AUCUN accusé de réception
      if (isCoach) return;
      if (e?.detail) {
        setReceiptToast(e.detail);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setReceiptToast(null);
        }, 12000);
      }
    };

    window.addEventListener('iml:appointment-scheduled', handleAppointmentScheduled);
    return () => {
      window.removeEventListener('iml:appointment-scheduled', handleAppointmentScheduled);
      if (timer) clearTimeout(timer);
    };
  }, [isCoach]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNotificationsOpen]);

  // Sous-menus disponibles selon l'icône sélectionnée ou survolée
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleItemMouseEnter = (id: string, _hasSubmenu: boolean) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredMenu(id);
  };

  const handleItemMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 250);
  };

  const handleFlyoutMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 250);
  };

  const searchParams = new URLSearchParams(location.search);
  const urlVue = searchParams.get('vue')?.toLowerCase();

  // Détermination du rôle effectif strictement basé sur le compte e-mail authentifié
  const effectiveRole = user?.role || (urlVue === 'coach' ? 'COACH' : urlVue === 'agent' ? 'AGENT' : 'DIRECTION');

  const isDirection = !!(
    effectiveRole === 'DIRECTION' ||
    user?.role === 'DIRECTION' ||
    user?.roleLabel?.toLowerCase().includes('direct') ||
    user?.email?.toLowerCase().includes('direction') ||
    user?.email?.toLowerCase().includes('directeur') ||
    user?.firstName?.toLowerCase().includes('directeur') ||
    user?.lastName?.toLowerCase().includes('directeur')
  );

  const submenus: Record<string, { title: string; subtitle?: string; items: { label: string; to: string; icon: any }[] }> = {
    organisation: {
      title: 'Organisation',
      subtitle: 'Bénéficiaires & acteurs',
      items: [
        { label: 'Bénéficiaires & PME', to: '/beneficiaires', icon: UserIcon },
        { label: 'Contacts & Réseau', to: '/contacts', icon: Contact },
        { label: 'Coachs & Mentors', to: '/coachs', icon: UserCheck },
      ]
    },
    accompagnement: {
      title: 'Accompagnement',
      subtitle: effectiveRole === 'COACH' ? 'Mentorat & livrables' : 'Suivi opérationnel',
      items: [
        { label: effectiveRole === 'COACH' ? 'Mon Agenda de mentorat' : 'Rendez-vous & Agenda', to: '/agendas', icon: Calendar },
        { label: effectiveRole === 'COACH' ? 'Notes d\'accompagnement' : 'Comptes-rendus d\'experts', to: '/notes-suivi', icon: BookOpen },
        { label: 'Documents & Livrables', to: '/documents', icon: FileText },
      ]
    }
  };

  const routeCategoryMap: Record<string, string[]> = {
    direction: ['/direction', '/pilotage', '/statistiques'],
    candidatures: ['/candidatures'],
    beneficiaires: ['/beneficiaires'],
    organisation: ['/beneficiaires', '/contacts', '/coachs', '/equipe'],
    accompagnement: ['/agendas', '/rendez-vous', '/documents', '/notes-suivi'],
  };

  const homeLink = effectiveRole === 'COACH' 
    ? '/tableau-de-bord?vue=coach' 
    : effectiveRole === 'DIRECTION' 
    ? '/direction' 
    : '/tableau-de-bord?vue=agent';

  // Navigation contextuelle et stricte selon le rôle :
  const allNavLinks = effectiveRole === 'COACH'
    ? [
        { id: 'accueil', to: '/tableau-de-bord?vue=coach', label: 'Cahier de bord', icon: Home, hasSubmenu: false, roles: ['COACH'] },
        { id: 'agendas', to: '/agendas', label: 'Mon Planning', icon: Calendar, hasSubmenu: false, roles: ['COACH'] },
      ]
    : effectiveRole === 'DIRECTION'
    ? [
        { id: 'direction', to: '/direction', label: 'Cockpit Stratégique & Trafic', icon: BarChart3, hasSubmenu: false, roles: ['DIRECTION'] },
        { id: 'candidatures', to: '/candidatures', label: 'Candidatures & Admissions', icon: Target, hasSubmenu: false, roles: ['DIRECTION'] },
      ]
    : [
        { id: 'accueil', to: homeLink, label: 'Accueil Guichet', icon: Home, hasSubmenu: false, roles: ['AGENT', 'ADMIN'] },
        { id: 'organisation', to: '/beneficiaires', label: 'Organisation', icon: Network, hasSubmenu: true, roles: ['AGENT', 'ADMIN'] },
        { id: 'accompagnement', to: '/agendas', label: 'Accompagnement', icon: HeartHandshake, hasSubmenu: true, roles: ['AGENT', 'ADMIN'] },
        { id: 'candidatures', to: '/candidatures', label: 'Candidatures & Admissions', icon: Target, hasSubmenu: false, roles: ['ADMIN'] },
      ];

  const navLinks = allNavLinks.filter(item => item.roles.includes(effectiveRole));

  const activeSubmenu = hoveredMenu || openSubmenu;

  return (
    <BreadcrumbProvider>
      <div className="h-screen w-screen overflow-hidden bg-[#fcfbf9] flex font-sans selection:bg-[#f06553] selection:text-white">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Backdrop pour fermer le sous-menu en cliquant sur le contenu (mode épinglé) */}
      {openSubmenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] transition-opacity"
          onClick={() => setOpenSubmenu(null)}
        />
      )}

      {/* =========================================================================
          SIDEBAR GAUCHE COMPACTE 60px (FIXE ET IMMOBILE)
         ========================================================================= */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-[60px] flex flex-col shrink-0 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Case supérieure blanche 60x60 avec le symbole officiel IML */}
        <div className="h-16 w-full bg-white border-b border-r border-slate-200/80 flex items-center justify-center shrink-0">
          <Link 
            to="/" 
            className="flex items-center justify-center hover:scale-105 transition-transform"
            title="Accueil iml digit"
          >
            <ImlSymbol size={42} />
          </Link>
        </div>

        {/* Colonne bleu ardoise sombre sous le logo */}
        <div className="flex-1 bg-[#1a3348] text-white flex flex-col items-center justify-between py-4 w-full relative">
          {/* Navigation Verticale */}
          <nav className="flex flex-col items-center gap-3.5 w-full">
            {navLinks.map(({ id, to, label, icon: Icon, hasSubmenu }) => {
              const isCurrentRoute = id === 'accueil'
                ? location.pathname === '/' || location.pathname === '/tableau-de-bord'
                : (routeCategoryMap[id]?.some(prefix => location.pathname.startsWith(prefix)) ?? false);
              const isSubmenuOpen = hasSubmenu && activeSubmenu === id;
              const isTurquoiseActive = isSubmenuOpen || (isCurrentRoute && !activeSubmenu);

              return (
                <div 
                  key={id}
                  className="relative flex items-center justify-center w-full"
                  onMouseEnter={() => handleItemMouseEnter(id, hasSubmenu)}
                  onMouseLeave={handleItemMouseLeave}
                >
                  <button
                    type="button"
                    title={label}
                    onClick={() => {
                      if (hasSubmenu) {
                        setOpenSubmenu(openSubmenu === id ? null : id);
                      } else {
                        setOpenSubmenu(null);
                        setHoveredMenu(null);
                        setMobileOpen(false);
                        navigate(to);
                      }
                    }}
                    className={`relative size-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer group ${
                      isTurquoiseActive
                        ? 'bg-[#23c3b1] text-white shadow-lg shadow-[#23c3b1]/40 scale-105'
                        : 'text-slate-300 hover:text-white hover:bg-white/15 hover:scale-110'
                    }`}
                  >
                    <Icon className="size-4.5 stroke-[1.75] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
                  </button>

                  {/* Petit triangle indicateur si le sous-menu de cette icône est ouvert */}
                  {isSubmenuOpen && (
                    <div className="hidden lg:block absolute -right-[1px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-[#23c3b1] z-50 pointer-events-none" />
                  )}

                  {/* Tooltip au survol pour les boutons directs sans sous-menu */}
                  {!hasSubmenu && hoveredMenu === id && (
                    <div className="hidden lg:flex absolute left-[54px] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#1a3348] border border-slate-700/80 text-white text-xs font-semibold shadow-xl whitespace-nowrap z-50 items-center gap-1.5 animate-in fade-in slide-in-from-left-1 pointer-events-none">
                      <span className="size-1.5 rounded-full bg-[#23c3b1]" />
                      {label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>


        </div>

        {/* =======================================================================
            SOUS-MENU DYNAMIQUE TRANSLUCIDE (S'OUVRE AU SURVOL DE LA SOURIS)
           ======================================================================= */}
        {activeSubmenu && navLinks.some(l => l.id === activeSubmenu) && submenus[activeSubmenu] && (
          <div 
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
            className="fixed left-[60px] top-0 bottom-0 w-[240px] bg-[#101f2e]/60 backdrop-blur-xl text-white border-r border-white/10 shadow-2xl shadow-black/30 z-50 flex flex-col animate-in fade-in slide-in-from-left-2 duration-150"
          >
            {/* En-tête du sous-menu translucide */}
            <div className="h-16 flex flex-col justify-center px-5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#23c3b1] animate-pulse" />
                <h2 className="text-[14px] font-bold text-white tracking-wide truncate">
                  {submenus[activeSubmenu].title}
                </h2>
              </div>
              {submenus[activeSubmenu].subtitle && (
                <p className="text-[11px] text-slate-300 mt-0.5 truncate pl-4">
                  {submenus[activeSubmenu].subtitle}
                </p>
              )}
            </div>

            {/* Liste des options interactives du sous-menu */}
            <div className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
              {submenus[activeSubmenu].items.map((item) => {
                const ItemIcon = item.icon;
                const isItemActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => {
                      setHoveredMenu(null);
                      setOpenSubmenu(null);
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all duration-150 group cursor-pointer ${
                      isItemActive
                        ? 'bg-[#23c3b1]/90 text-white font-medium shadow-md shadow-[#23c3b1]/30 backdrop-blur-xs'
                        : 'text-slate-200 hover:text-white hover:bg-white/15 hover:translate-x-0.5'
                    }`}
                  >
                    <div className={`size-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isItemActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white/10 text-slate-200 group-hover:bg-[#23c3b1] group-hover:text-white'
                    }`}>
                      <ItemIcon className="size-3.5 stroke-[1.75]" />
                    </div>
                    <span className="font-medium truncate drop-shadow-xs">{item.label}</span>
                    <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#23c3b1] ml-auto shrink-0" />
                  </Link>
                );
              })}
            </div>

            {/* Pied du volet latéral translucide */}
            <div className="p-3.5 border-t border-white/10 bg-white/[0.03] backdrop-blur-md text-[11px] text-slate-300 flex items-center justify-between">
              <span>IML Digital</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 text-slate-200 font-mono">v2.0</span>
            </div>
          </div>
        )}
      </aside>

      {/* =========================================================================
          ZONE PRINCIPALE + TOPBAR BLANCHE ÉPURÉE (IMMOBILE AU SCROLL)
         ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Topbar blanche conforme à l'image - Fixe et immobile */}
        <header className="h-16 bg-white border-b border-slate-200/80 shrink-0 px-4 sm:px-8 flex items-center justify-between gap-4 z-30">
          
          {/* Gauche : Bouton menu mobile */}
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100" 
              onClick={() => setMobileOpen(true)}
              title="Menu"
            >
              <Menu className="size-5" />
            </button>
          </div>

          {/* Centre : Barre de recherche blanche "Rechercher un bénéficiaire" */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem('searchBeneficiary') as HTMLInputElement;
              if (input && input.value.trim()) {
                navigate(`/beneficiaires?search=${encodeURIComponent(input.value.trim())}`);
              }
            }}
            className="hidden md:flex items-center flex-1 max-w-sm mx-4"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input 
                name="searchBeneficiary"
                type="text" 
                placeholder="Rechercher un bénéficiaire (Entrée)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#2dd4bf] transition-all shadow-inner"
              />
            </div>
          </form>

          {/* Droite : Calendrier (Icône interactive), Cloche & Profil Utilisateur */}
          <div className="flex items-center gap-3 sm:gap-4">
            {!isDirection && (
              <>
                <button 
                  type="button"
                  onClick={() => {
                    if (location.pathname === '/' || location.pathname === '/tableau-de-bord') {
                      window.dispatchEvent(new CustomEvent('open-calendar-drawer'));
                    } else {
                      navigate('/agendas');
                    }
                  }}
                  className="p-1.5 text-slate-600 hover:text-[#23c3b1] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
                  title="Mon calendrier (Ouvrir)"
                >
                  <Calendar className="size-4" />
                </button>

                {/* Cloche de notifications interactive avec badge et aperçu des demandes */}
                <div className="relative" ref={notificationsRef}>
              <button 
                type="button"
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                className={`p-1.5 transition-colors relative rounded-lg cursor-pointer flex items-center justify-center ${
                  isNotificationsOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Notifications & Nouvelles candidatures"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#f06553] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                    {alertCount}
                  </span>
                )}
              </button>

              {/* Menu déroulant des alertes */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 text-[#f06553]" />
                      <h3 className="font-semibold text-xs">
                        {isCoach ? 'Nouveaux bénéficiaires & Séances' : 'Alertes & Nouvelles demandes'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {alertCount > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={markAllAlertsAsRead}
                            className="text-[10px] text-slate-300 hover:text-white underline cursor-pointer"
                            title="Marquer toutes les alertes comme vues"
                          >
                            Tout marquer lu
                          </button>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f06553] text-white">
                            {alertCount} nouveau{alertCount > 1 ? 'x' : ''}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-teal-300 font-medium flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> À jour
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {isCoach ? (
                      /* LISTE POUR LE COACH : Bénéficiaires transmis par l'agent de planification */
                      unreadCoachAppts.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <CheckCircle2 className="size-7 mx-auto mb-2 text-[#23c3b1]" />
                          <p className="font-semibold text-slate-700">Aucun nouveau bénéficiaire en attente</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Tous les dossiers transmis par l'agent ont été consultés.</p>
                        </div>
                      ) : (
                        unreadCoachAppts.map((app: any) => {
                          const ben = app.beneficiary || {};
                          const benName = `${ben.firstName || ''} ${ben.lastName || ''}`.trim() || 'Bénéficiaire';
                          const projName = ben.projects?.[0]?.name || 'Dossier d\'accompagnement';
                          const apptDate = new Date(app.datetime);
                          const isVideo = app.location && (app.location.includes('http') || app.location.toLowerCase().includes('visio'));

                          return (
                            <div key={app.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-2 group relative">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center gap-1">
                                  <UserCheck className="size-3 text-[#23c3b1]" />
                                  <span>Nouveau bénéficiaire affecté</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">
                                    {formatNotificationDate(app.createdAt || app.datetime)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markCoachAlertAsRead(app.id);
                                    }}
                                    title="Marquer comme lu"
                                    className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-[#23c3b1] transition-opacity p-0.5 cursor-pointer rounded hover:bg-slate-200/50"
                                  >
                                    <CheckCircle2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {benName}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span>Projet :</span>
                                  <span className="font-medium text-slate-700 truncate">{projName}</span>
                                </div>
                              </div>

                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                  <Calendar className="size-3 text-[#f06553]" />
                                  <span>
                                    {apptDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {apptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({app.duration || 60} min)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  {isVideo ? (
                                    <>
                                      <Video className="size-3 text-[#f06553]" />
                                      <span>Visioconférence en ligne (Lien sécurisé)</span>
                                    </>
                                  ) : (
                                    <>
                                      <MapPin className="size-3 text-[#23c3b1]" />
                                      <span className="truncate">{app.location || 'Siège IML Digit, Libreville'}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Action directe pour le coach : Ouvrir le dossier et les documents */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <Link
                                  to={`/beneficiaires/${ben.id}?tab=documents`}
                                  onClick={() => {
                                    markCoachAlertAsRead(app.id);
                                    setIsNotificationsOpen(false);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                  title="Consulter le dossier complet avec tous les documents, diagnostic et projet"
                                >
                                  <FolderOpen className="size-3.5" />
                                  <span>Ouvrir le dossier & Documents</span>
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      )
                    ) : (
                      /* LISTE POUR L'AGENT / DIRECTION : Réservations de salle + Messages de contact + Bénéficiaires + Comptes-rendus + Nouvelles candidatures */
                      (unreadApps.length === 0 && unreadBeneficiaries.length === 0 && unreadNotes.length === 0 && unreadRoomBookings.length === 0 && unreadContacts.length === 0) ? (
                        <div className="p-6 text-center text-slate-400">
                          <CheckCircle2 className="size-7 mx-auto mb-2 text-[#23c3b1]" />
                          <p className="font-semibold text-slate-700">Toutes les alertes ont été consultées</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Aucune nouvelle demande de candidature, bénéficiaire inscrit, réservation de salle, compte-rendu ni contact en attente
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {/* 0. MESSAGES & DEMANDES DE CONTACT REÇUS DU SITE WEB */}
                          {unreadContacts.map((c: any) => {
                            const formattedDate = formatNotificationDate(c.createdAt);

                            return (
                              <div key={c.id} className="p-3.5 bg-amber-50/50 hover:bg-amber-50/90 transition-colors space-y-2 group relative border-l-3 border-[#FF5B37]">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5B37]/15 text-[#FF5B37] border border-[#FF5B37]/30 flex items-center gap-1">
                                    <Mail className="size-3 text-[#FF5B37]" />
                                    <span>Demande de contact reçue</span>
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                                      {formattedDate}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markContactAlertAsRead(c.id);
                                      }}
                                      title="Marquer comme lu"
                                      className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-[#FF5B37] transition-opacity p-0.5 cursor-pointer rounded hover:bg-slate-200/50"
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {c.name}
                                  </div>
                                  <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                                    Objet : <span className="text-slate-800 font-bold">{c.subject}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-1 italic bg-white/70 p-1.5 rounded border border-amber-200/50">
                                    « {c.message} »
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <Link
                                    to="/contacts"
                                    onClick={() => {
                                      markContactAlertAsRead(c.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-[#FF5B37] hover:bg-[#e94d29] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <Mail className="size-3" />
                                    <span>Consulter & Répondre</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}

                          {/* 0.5 NOUVEAUX BÉNÉFICIAIRES INSCRITS / TRANSMIS */}
                          {unreadBeneficiaries.map((b: any) => {
                            const benName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Nouveau porteur';
                            const company = b.companyName || b.projects?.[0]?.name || 'Projet en cours';
                            const formattedDate = formatNotificationDate(b.createdAt);

                            return (
                              <div key={b.id} className="p-3.5 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors space-y-2 group relative border-l-3 border-emerald-500">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <UserCheck className="size-3 text-emerald-600" />
                                    <span>Nouveau Bénéficiaire inscrit</span>
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                                      {formattedDate}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markBeneficiaryAlertAsRead(b.id);
                                      }}
                                      title="Marquer comme lu"
                                      className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 transition-opacity p-0.5 cursor-pointer rounded hover:bg-slate-200/50"
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {benName}
                                  </div>
                                  <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                                    Structure : <span className="text-slate-800 font-semibold">{company}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <Link
                                    to={`/beneficiaires/${b.id}`}
                                    onClick={() => {
                                      markBeneficiaryAlertAsRead(b.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <FolderOpen className="size-3" />
                                    <span>Voir le dossier bénéficiaire</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                          {/* 1. CANDIDATURES REÇUES AUJOURD'HUI */}
                          {todayApps.map((a: any) => {
                            const applicant = a.applicantData || {};
                            const project = a.projectData || {};
                            const name = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Porteur de projet';
                            const company = applicant.companyName || project.title || 'Projet sans nom';
                            const code = `IML-2026-${String(a.seqNumber).padStart(4, '0')}`;
                            const formattedDate = formatNotificationDate(a.submittedAt || a.createdAt);

                            return (
                              <div key={a.id} className="p-3.5 bg-rose-50/35 hover:bg-rose-50/70 transition-colors space-y-1.5 group relative border-l-3 border-[#f06553]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[#f06553] text-[11px]">{code}</span>
                                    <span className="text-[9.5px] font-extrabold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded border border-rose-200/80 flex items-center gap-1 shadow-2xs">
                                      <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                                      Aujourd'hui
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                                      {formattedDate}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAlertAsRead(a.id);
                                      }}
                                      title="Marquer comme lu"
                                      className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-[#23c3b1] transition-opacity p-0.5 cursor-pointer rounded hover:bg-slate-200/50"
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="font-semibold text-slate-900">{name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <span>Projet :</span>
                                  <span className="font-medium text-slate-700 truncate">{company}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Link
                                    to={`/candidatures/${a.id}`}
                                    onClick={() => {
                                      markAlertAsRead(a.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-[#102a43] hover:bg-[#193a5c] text-white text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                                  >
                                    Consulter la candidature
                                  </Link>
                                  <Link
                                    to="/beneficiaires"
                                    onClick={() => {
                                      markAlertAsRead(a.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-[#178578] text-[10px] font-medium transition-colors cursor-pointer"
                                  >
                                    Voir dans Bénéficiaires
                                  </Link>
                                </div>
                              </div>
                            );
                          })}

                          {/* 2. NOUVELLES RÉSERVATIONS DE SALLE (DIRECTION & AGENTS) */}
                          {unreadRoomBookings.map((b: any) => {
                            const date = new Date(b.startAt);
                            const formattedDate = formatNotificationDate(b.createdAt || b.startAt);
                            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

                            return (
                              <div key={b.id} className="p-3.5 bg-orange-50/40 hover:bg-orange-50/80 transition-colors space-y-2 group relative border-l-3 border-[#FF5B37]">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5B37]/15 text-[#FF5B37] border border-[#FF5B37]/30 flex items-center gap-1">
                                    <Building2 className="size-3 text-[#FF5B37]" />
                                    <span>Réservation de Salle</span>
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                                      {formattedDate}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markRoomAlertAsRead(b.id);
                                      }}
                                      title="Marquer comme lu"
                                      className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-[#FF5B37] transition-opacity p-0.5 cursor-pointer rounded hover:bg-slate-200/50"
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <Link
                                    to={`/tableau-de-bord?tab=salle&bookingId=${b.id}`}
                                    onClick={() => {
                                      markRoomAlertAsRead(b.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="font-bold text-slate-900 hover:text-[#FF5B37] text-xs sm:text-sm block transition-colors cursor-pointer"
                                  >
                                    {b.organizerName} {b.organization ? <span className="text-slate-500 font-normal">({b.organization})</span> : null}
                                  </Link>
                                  <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                                    <Calendar className="size-3 text-[#FF5B37]" />
                                    <span>Créneau : <strong>{date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {timeStr}</strong> ({b.attendees} participants)</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <Link
                                    to={`/tableau-de-bord?tab=salle&bookingId=${b.id}`}
                                    onClick={() => {
                                      markRoomAlertAsRead(b.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-[#FF5B37] hover:bg-[#e94d29] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <Building2 className="size-3" />
                                    <span>Traiter la réservation</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}

                          {/* 3. NOUVEAUX COMPTES-RENDUS RÉDIGÉS PAR LES EXPERTS / COACHS */}
                          {unreadNotes.map((n: any) => {
                            const authorName = `${n.author?.firstName || 'Expert'} ${n.author?.lastName || ''}`.trim();
                            const benName = `${n.beneficiary?.firstName || ''} ${n.beneficiary?.lastName || ''}`.trim() || 'Bénéficiaire';
                            const compName = n.beneficiary?.projects?.[0]?.name || n.beneficiary?.companyName || 'Projet en cours';
                            const formattedDate = formatNotificationDate(n.createdAt || n.sessionDate);

                            return (
                              <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-2 group relative border-l-3 border-[#23c3b1] bg-teal-50/15">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                                    <BookOpen className="size-3 text-[#23c3b1]" />
                                    <span>Compte-rendu d'expert déposé</span>
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                                      {formattedDate}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNoteAlertAsRead(n.id);
                                      }}
                                      title="Marquer comme lu"
                                      className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-[#23c3b1] transition-opacity p-0.5 cursor-pointer rounded hover:bg-slate-200/50"
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <div className="text-[11px] text-slate-600">
                                    Rédigé par : <strong className="text-slate-900">{authorName}</strong>
                                  </div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {benName} <span className="text-slate-500 font-normal">({compName})</span>
                                  </div>
                                  <div className="text-[11px] text-teal-800 font-medium">
                                    Séance : « {n.topic || 'Mentorat & Suivi'} »
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <Link
                                    to={`/beneficiaires/${n.beneficiary?.id}?tab=suivi`}
                                    onClick={() => {
                                      markNoteAlertAsRead(n.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-[#102a43] hover:bg-[#193a5c] text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <BookOpen className="size-3" />
                                    <span>Consulter le compte-rendu</span>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}

                          {/* 4. AUTRES CANDIDATURES EN ATTENTE */}
                          {olderApps.map((a: any) => {
                            const applicant = a.applicantData || {};
                            const project = a.projectData || {};
                            const name = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Porteur de projet';
                            const company = applicant.companyName || project.title || 'Projet sans nom';
                            const code = `IML-2026-${String(a.seqNumber).padStart(4, '0')}`;
                            const formattedDate = formatNotificationDate(a.submittedAt || a.createdAt);

                            return (
                              <div key={a.id} className="p-3 hover:bg-slate-50 transition-colors space-y-1.5 group relative">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#f06553] text-[11px]">{code}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                                      {formattedDate}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAlertAsRead(a.id);
                                      }}
                                      title="Marquer comme lu"
                                      className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-[#23c3b1] transition-opacity p-0.5 cursor-pointer rounded hover:bg-slate-200/50"
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="font-semibold text-slate-800">{name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <span>Projet :</span>
                                  <span className="font-medium text-slate-700 truncate">{company}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Link
                                    to={`/candidatures/${a.id}`}
                                    onClick={() => {
                                      markAlertAsRead(a.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                                  >
                                    Consulter la candidature
                                  </Link>
                                  <Link
                                    to="/beneficiaires"
                                    onClick={() => {
                                      markAlertAsRead(a.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-[#178578] text-[10px] font-medium transition-colors cursor-pointer"
                                  >
                                    Voir dans Bénéficiaires
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    {isCoach ? (
                      <Link
                        to="/agendas"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[11px] font-semibold text-[#23c3b1] hover:underline"
                      >
                        Consulter mon planning complet de séances →
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-3 text-[11px]">
                        <Link
                          to="/beneficiaires"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="font-semibold text-[#23c3b1] hover:underline"
                        >
                          Répertoire des bénéficiaires →
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link
                          to="/candidatures"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="font-semibold text-[#102a43] hover:underline"
                        >
                          Toutes les candidatures →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

            {/* Profil utilisateur connecté avec déconnexion */}
            <div className={`flex items-center gap-2 ${!isDirection ? 'pl-2 border-l border-slate-200' : ''}`}>
              <div className="size-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <UserIcon className="size-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 tracking-wide">
                {user ? `${user.firstName} ${user.lastName}`.trim() : 'Agent IML'}
              </span>
              <button 
                onClick={() => void logout()}
                title="Se déconnecter"
                aria-label="Se déconnecter"
                className="p-1 ml-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content avec scroll vertical interne : le header et la sidebar restent 100% fixes */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 pb-28 sm:pb-32 relative bg-[#f7f8f9]">
          {/* Forme incurvée rose/pêche caractéristique en arrière-plan à droite sans déclencher de second scrollbar */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0" aria-hidden="true">
            <div className="absolute -right-20 top-0 w-[520px] h-[720px] bg-[#fce9e6]/50 rounded-bl-[260px]" />
          </div>
          <div className="relative z-10">
            <AppBreadcrumb />
            <Outlet />
          </div>
        </main>

        {/* =========================================================================
            BOUTONS D'ACTION FLOTTANTS GLOBAUX (1: WhatsApp, 2: E-mail)
            Réservés uniquement à l'Agent d'accueil et de planification.
            Masqués pour le Coach et pour la Direction.
            Se décalent automatiquement vers la gauche si le calendrier est ouvert
            pour ne pas masquer les boutons de planification et le bouton Fermer.
           ========================================================================= */}
        {effectiveRole === 'AGENT' && (
          <div 
            className={`fixed bottom-6 z-[110] flex flex-col items-center gap-2 transition-all duration-300 ease-in-out ${
              isCalendarDrawerOpen 
                ? 'right-[405px] sm:right-[405px] max-sm:right-auto max-sm:left-4 max-sm:bottom-24' 
                : 'right-6'
            }`}
          >
            {/* Bouton 1 : WhatsApp Direct */}
            <button
              type="button"
              onClick={() => setIsQuickWhatsAppOpen(true)}
              title="WhatsApp direct (Bénéficiaires, Coachs & Contacts)"
              aria-label="WhatsApp direct"
              className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg shadow-[#f06553]/35 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/40"
            >
              <WhatsAppSvg className="size-5.5 text-white" />
            </button>

            {/* Bouton 2 : E-mail Direct */}
            <button
              type="button"
              onClick={() => setIsQuickEmailOpen(true)}
              title="E-mail direct (Convocations, Comptes-rendus & Pièces)"
              aria-label="E-mail direct"
              className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg shadow-[#f06553]/35 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/40"
            >
              <Mail className="size-4.5 text-white stroke-[2.2]" />
            </button>
          </div>
        )}

        {/* Modales globales de communication WhatsApp & E-mail */}
        <QuickWhatsAppModal
          isOpen={isQuickWhatsAppOpen}
          onClose={() => setIsQuickWhatsAppOpen(false)}
        />
        <QuickEmailModal
          isOpen={isQuickEmailOpen}
          onClose={() => setIsQuickEmailOpen(false)}
        />


        {/* Modale globale : Bloc-notes rapide */}
        {isGlobalNotesOpen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-[#f06553]/10 text-[#f06553] flex items-center justify-center">
                    <Copy className="size-3.5" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">
                    Bloc-notes rapide (Partout sur la plateforme)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGlobalNotesOpen(false)}
                  className="size-7 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                    Notes, rappels et mémos opérationnels
                  </label>
                  <textarea
                    value={globalNote}
                    onChange={(e) => handleSaveGlobalNote(e.target.value)}
                    rows={7}
                    placeholder="Notez vos idées, comptes-rendus express ou tâches à ne pas oublier..."
                    className="w-full text-xs p-3 rounded border border-slate-200 focus:outline-none focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] text-slate-800 placeholder:text-slate-400 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    ✓ Sauvegarde automatique en temps réel dans votre session locale.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveGlobalNote('')}
                    className="text-slate-400 hover:text-rose-600 text-xs transition-colors cursor-pointer"
                  >
                    Effacer le mémo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGlobalNotesOpen(false)}
                    className="h-8 px-4 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* PETITE NOTIFICATION D'ACCUSÉ DE RÉCEPTION POUR L'AGENT DE PLANIFICATION (JAMAIS POUR LE COACH) */}
        {!isCoach && receiptToast && typeof document !== 'undefined' && createPortal(
          <div 
            className="fixed top-5 right-5 z-[9999] max-w-sm w-[92vw] sm:w-[410px] bg-white rounded-2xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-top-4 fade-in duration-300 text-slate-800 border-2 border-emerald-500 ring-4 ring-emerald-100"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>Accusé de réception</span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptToast(null)}
                className="size-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div>
              <div className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                Le message est bien parti : ils ont bien reçu !
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Le coach et le bénéficiaire ont tous deux bien reçu leur convocation.
              </p>
            </div>

            <div className="p-2.5 rounded-xl border text-xs space-y-1.5 bg-emerald-50/70 border-emerald-200/80">
              {/* Statut Coach */}
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold text-xs mt-0.5">✓</span>
                <div className="text-slate-800">
                  <span className="font-semibold text-slate-900">Coach ({receiptToast.coachName}) :</span>{' '}
                  <span className="text-slate-600">Reçu dans son planning de la plateforme</span>
                </div>
              </div>

              {/* Statut Bénéficiaire */}
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold text-xs mt-0.5">✓</span>
                <div className="text-slate-800">
                  <span className="font-semibold text-slate-900">Bénéficiaire ({receiptToast.recipientName}) :</span>{' '}
                  <span className="text-emerald-700 font-medium truncate">
                    Reçu par e-mail {receiptToast.recipientEmail ? `(${receiptToast.recipientEmail})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
    </BreadcrumbProvider>
  );
}
