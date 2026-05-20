import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Dumbbell,
  GraduationCap,
  ListChecks,
  MessageSquare,
  Mic,
  Moon,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

type BlockType = "Clase" | "Estudio" | "Examen" | "Personal";

type CalendarBlock = {
  id: string;
  title: string;
  type: BlockType;
  day: number;
  startHour: number;
  duration: number;
  color: "blue" | "green" | "pink" | "purple" | "yellow";
  reminderAt?: string;
};

type Task = {
  id: string;
  text: string;
  priority: number;
  done: boolean;
  reminderAt?: string;
};

type Evaluation = {
  id: string;
  title: string;
  dueDate: string;
  color: "blue" | "green";
  reminderAt?: string;
};

type Habit = {
  id: string;
  label: string;
  icon: "sport" | "coffee" | "family" | "group";
  active: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type Toast = {
  id: string;
  title: string;
  description: string;
};

const STORAGE_KEY = "organizador-universitario-v2";
const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const startHour = 8;
const endHour = 22;
const totalHours = endHour - startHour;
const hourHeight = 64;
const halfHourSnap = 0.5;

const pastelPalette = {
  blue: "bg-sky-100 border-sky-200 text-slate-800",
  green: "bg-emerald-100 border-emerald-200 text-slate-800",
  pink: "bg-rose-100 border-rose-200 text-slate-800",
  purple: "bg-violet-100 border-violet-200 text-slate-800",
  yellow: "bg-amber-100 border-amber-200 text-slate-800",
};

const priorityColors = [
  "bg-slate-400",
  "bg-emerald-500",
  "bg-lime-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-rose-500",
];

const motivationalQuotes = [
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "No necesitas más tiempo: necesitas más claridad.",
  "Organizarte hoy es regalarte tranquilidad mañana.",
  "La constancia vence a la saturación cuando hay un buen plan.",
  "Cada tarea que ordenas deja más espacio para pensar mejor.",
  "Tu semana mejora cuando dejas de reaccionar y empiezas a priorizar.",
  "La productividad sana comienza cuando el control reemplaza al caos.",
];

const initialData = {
  blocks: [
    { id: "b1", title: "Matemáticas - Estudio", type: "Estudio" as BlockType, day: 0, startHour: 9, duration: 2, color: "blue" as const },
    { id: "b2", title: "Historia", type: "Clase" as BlockType, day: 1, startHour: 10.5, duration: 1, color: "blue" as const },
    { id: "b3", title: "Biología", type: "Clase" as BlockType, day: 1, startHour: 12.5, duration: 1.5, color: "green" as const },
    { id: "b4", title: "Historia", type: "Clase" as BlockType, day: 2, startHour: 11.5, duration: 5, color: "green" as const },
    { id: "b5", title: "Examen Final Física", type: "Examen" as BlockType, day: 3, startHour: 9, duration: 1.5, color: "green" as const },
    { id: "b6", title: "Biología", type: "Clase" as BlockType, day: 4, startHour: 11.5, duration: 4, color: "blue" as const },
    { id: "b7", title: "Sesión Grupal", type: "Personal" as BlockType, day: 5, startHour: 10, duration: 4, color: "green" as const },
  ] as CalendarBlock[],
  tasks: [
    { id: "t1", text: "Estudiar para examen Matemáticas", priority: 1, done: false },
    { id: "t2", text: "Preparar presentación grupal", priority: 2, done: false },
    { id: "t3", text: "Revisar guía de Biología", priority: 3, done: false },
    { id: "t4", text: "Preparar ensayo", priority: 4, done: false },
    { id: "t5", text: "Practicar exposición", priority: 5, done: false },
  ] as Task[],
  evaluations: [
    { id: "e1", title: "18 Abr - Examen Matemáticas", dueDate: new Date().toISOString(), color: "green" as const },
    { id: "e2", title: "18 Abr - Entrega Matemáticas", dueDate: new Date(Date.now() + 86400000).toISOString(), color: "green" as const },
    { id: "e3", title: "22 Abr - Entrega Proyecto Historia", dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), color: "blue" as const },
  ] as Evaluation[],
  habits: [
    { id: "h1", label: "Deporte", icon: "sport" as const, active: false },
    { id: "h2", label: "Café", icon: "coffee" as const, active: false },
    { id: "h3", label: "Familia", icon: "family" as const, active: false },
    { id: "h4", label: "Grupo", icon: "group" as const, active: false },
  ] as Habit[],
  messages: [
    {
      id: "m0",
      role: "assistant" as const,
      text: "Hola. Soy tu asistente de organización. Puedo analizar tu carga académica, sugerirte bloques de estudio y desglosar tareas complejas. Prueba con: “analiza mi semana” o “desglosa preparar presentación grupal”.",
    },
  ] as ChatMessage[],
};

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function blockColor(type: BlockType): CalendarBlock["color"] {
  if (type === "Examen") return "green";
  if (type === "Estudio") return "blue";
  if (type === "Personal") return "green";
  return "blue";
}

function iconForHabit(habit: Habit["icon"]) {
  const common = "h-5 w-5";
  switch (habit) {
    case "sport":
      return <Dumbbell className={common} />;
    case "coffee":
      return <Coffee className={common} />;
    case "family":
      return <Moon className={common} />;
    case "group":
      return <Users className={common} />;
  }
}

function hoursToTop(hour: number) {
  return (hour - startHour) * hourHeight;
}

function durationToHeight(duration: number) {
  return duration * hourHeight;
}

function parseCommand(transcript: string) {
  const clean = transcript.trim();
  const lower = clean.toLowerCase();

  if (lower.startsWith("agregar tarea")) {
    const text = clean.split(":")[1]?.trim() || clean.replace(/agregar tarea/i, "").trim();
    return { type: "task" as const, payload: text || "Nueva tarea dictada" };
  }

  if (lower.startsWith("agregar evaluación") || lower.startsWith("agregar evaluacion")) {
    const text = clean.split(":")[1]?.trim() || clean.replace(/agregar evaluación|agregar evaluacion/i, "").trim();
    return { type: "evaluation" as const, payload: text || "Nueva evaluación dictada" };
  }

  if (lower.startsWith("agregar bloque")) {
    const text = clean.split(":")[1]?.trim() || clean.replace(/agregar bloque/i, "").trim();
    return { type: "block" as const, payload: text || "Nuevo bloque" };
  }

  return { type: "assistant" as const, payload: clean };
}

function nextStudySuggestion(blocks: CalendarBlock[]) {
  const occupancyByDay = Array.from({ length: 7 }, (_, day) => {
    const dayBlocks = blocks.filter((b) => b.day === day);
    const total = dayBlocks.reduce((acc, b) => acc + b.duration, 0);
    return { day, total };
  }).sort((a, b) => a.total - b.total);

  const best = occupancyByDay[0];
  const dayLabel = dayNames[best.day];
  return `Tu día más liviano es ${dayLabel}. Te conviene reservar un bloque de estudio profundo entre las 16:00 y 18:00 para avanzar sin saturarte.`;
}

function upcomingEvaluations(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);
}

function generateAssistantReply(input: string, blocks: CalendarBlock[], tasks: Task[], evaluations: Evaluation[]) {
  const text = input.toLowerCase();
  const pendingTasks = tasks.filter((t) => !t.done);
  const urgent = pendingTasks.slice(0, 3);
  const upcoming = upcomingEvaluations(evaluations);

  if (text.includes("analiza") || text.includes("carga") || text.includes("semana")) {
    const dayLoad = dayNames
      .map((day, index) => {
        const total = blocks.filter((b) => b.day === index).reduce((acc, b) => acc + b.duration, 0);
        return { day, total };
      })
      .sort((a, b) => b.total - a.total);

    const busiest = dayLoad[0];
    const lightest = dayLoad[dayLoad.length - 1];
    return `Analicé tu semana: ${busiest.day} es tu día más cargado con ${busiest.total.toFixed(1)} horas agendadas, mientras que ${lightest.day} es el más liviano con ${lightest.total.toFixed(1)} horas. Te recomiendo proteger un bloque de estudio en el día más liviano, anticipar las evaluaciones próximas${upcoming.length ? ` (${upcoming.map((e) => e.title).join(", ")})` : ""} y dividir tus prioridades más altas en sesiones de 45 a 60 minutos.`;
  }

  if (text.includes("horario") || text.includes("estudio") || text.includes("mejor hora")) {
    return `${nextStudySuggestion(blocks)} Además, evita poner estudio pesado justo después de tu tramo más largo de clases. Usa bloques cortos de repaso y uno largo para trabajo profundo.`;
  }

  if (text.includes("desglosa") || text.includes("desglosar") || text.includes("pasos")) {
    const guessedTask = pendingTasks.find((t) => text.includes(t.text.toLowerCase().split(" ")[0]));
    const taskName = guessedTask?.text || input.replace(/desglosa|desglosar|en pasos/gi, "").trim() || "tu tarea";
    return `Propongo desglosar “${taskName}” así: 1) define el objetivo exacto, 2) reúne material o pauta, 3) crea un esquema breve, 4) divide la ejecución en bloques de 30-45 minutos y 5) deja un bloque final de revisión. Así reduces fricción y evitas empezar sin claridad.`;
  }

  if (text.includes("prioridad") || text.includes("qué hago primero") || text.includes("que hago primero")) {
    return `Te sugiero comenzar por: ${urgent.map((t) => t.text).join("; ") || "la tarea con fecha más cercana"}. Usa este orden: urgencia, peso en la nota y tiempo requerido. Si una tarea toma más de una hora, córtala en subtareas antes de empezar.`;
  }

  return "Puedo ayudarte a analizar tu carga, sugerir mejores horarios de estudio y desglosar tareas complejas. Prueba con: “analiza mi semana”, “¿qué hago primero?” o “desglosa preparar presentación grupal”.";
}

function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.04;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // noop
  }
}

export default function App() {
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState(new Date());
  const [blocks, setBlocks] = useState<CalendarBlock[]>(initialData.blocks);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialData.evaluations);
  const [habits, setHabits] = useState<Habit[]>(initialData.habits);
  const [messages, setMessages] = useState<ChatMessage[]>(initialData.messages);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [newTask, setNewTask] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"global" | "assistant">("global");
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);

  const [blockForm, setBlockForm] = useState({
    title: "",
    type: "Clase" as BlockType,
    day: 0,
    startHour: 9,
    duration: 1.5,
    reminderAt: "",
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setBlocks(parsed.blocks ?? initialData.blocks);
        setTasks(parsed.tasks ?? initialData.tasks);
        setEvaluations(parsed.evaluations ?? initialData.evaluations);
        setHabits(parsed.habits ?? initialData.habits);
        setMessages(parsed.messages ?? initialData.messages);
        setNotifiedIds(parsed.notifiedIds ?? []);
      } catch {
        // noop
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ blocks, tasks, evaluations, habits, messages, notifiedIds })
    );
  }, [blocks, tasks, evaluations, habits, messages, notifiedIds]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date().getTime();
      const dueNotifications: Array<{ id: string; title: string; description: string }> = [];

      blocks.forEach((block) => {
        if (block.reminderAt && !notifiedIds.includes(`block-${block.id}`) && new Date(block.reminderAt).getTime() <= current) {
          dueNotifications.push({
            id: `block-${block.id}`,
            title: "Recordatorio de bloque",
            description: `${block.title} comienza pronto o ya llegó su hora.`,
          });
        }
      });

      tasks.forEach((task) => {
        if (task.reminderAt && !notifiedIds.includes(`task-${task.id}`) && new Date(task.reminderAt).getTime() <= current) {
          dueNotifications.push({
            id: `task-${task.id}`,
            title: "Recordatorio de tarea",
            description: task.text,
          });
        }
      });

      evaluations.forEach((evaluation) => {
        if (evaluation.reminderAt && !notifiedIds.includes(`evaluation-${evaluation.id}`) && new Date(evaluation.reminderAt).getTime() <= current) {
          dueNotifications.push({
            id: `evaluation-${evaluation.id}`,
            title: "Evaluación importante",
            description: evaluation.title,
          });
        }
      });

      if (dueNotifications.length) {
        playBeep();
        dueNotifications.forEach((item) => {
          setToasts((prev) => [...prev, { id: uid("toast"), title: item.title, description: item.description }]);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(item.title, { body: item.description });
          }
        });
        setNotifiedIds((prev) => [...prev, ...dueNotifications.map((n) => n.id)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [blocks, tasks, evaluations, notifiedIds]);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts]);

  const dayColumnWidth = useMemo(() => {
    if (!calendarRef.current) return 150;
    return (calendarRef.current.clientWidth - 70) / 7;
  }, [calendarRef.current, now]);

  const quoteOfTheDay = useMemo(() => {
    const dayIndex = new Date().getDate() % motivationalQuotes.length;
    return motivationalQuotes[dayIndex];
  }, []);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.priority - b.priority);
  }, [tasks]);

  const sendToAssistant = (content: string) => {
    if (!content.trim()) return;
    const userMessage: ChatMessage = { id: uid("msg"), role: "user", text: content.trim() };
    const reply: ChatMessage = {
      id: uid("msg"),
      role: "assistant",
      text: generateAssistantReply(content, blocks, tasks, evaluations),
    };
    setMessages((prev) => [...prev, userMessage, reply]);
    setAssistantInput("");
    setAssistantOpen(true);
  };

  const startVoiceRecognition = (mode: "global" | "assistant" = "global") => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToasts((prev) => [
        ...prev,
        {
          id: uid("toast"),
          title: "Micrófono no disponible",
          description: "Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.",
        },
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-CL";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    setVoiceMode(mode);

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const command = parseCommand(transcript);

      if (command.type === "task") {
        setTasks((prev) =>
          [{ id: uid("task"), text: command.payload, priority: clamp(prev.length + 1, 1, 5), done: false }, ...prev].slice(0, 10)
        );
        setToasts((prev) => [...prev, { id: uid("toast"), title: "Tarea agregada", description: command.payload }]);
      } else if (command.type === "evaluation") {
        setEvaluations((prev) => [
          { id: uid("eval"), title: command.payload, dueDate: new Date(Date.now() + 86400000).toISOString(), color: "green" },
          ...prev,
        ]);
        setToasts((prev) => [...prev, { id: uid("toast"), title: "Evaluación agregada", description: command.payload }]);
      } else if (command.type === "block") {
        setBlocks((prev) => [
          ...prev,
          {
            id: uid("block"),
            title: command.payload,
            type: "Estudio",
            day: 0,
            startHour: 18,
            duration: 1.5,
            color: "blue",
          },
        ]);
        setToasts((prev) => [...prev, { id: uid("toast"), title: "Bloque agregado", description: command.payload }]);
      } else {
        sendToAssistant(command.payload);
      }
    };

    recognition.onerror = () => {
      setToasts((prev) => [
        ...prev,
        {
          id: uid("toast"),
          title: "No se pudo escuchar",
          description: "Intenta nuevamente o usa texto para interactuar.",
        },
      ]);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const openCreateBlock = () => {
    setEditingBlock(null);
    setBlockForm({ title: "", type: "Clase", day: 0, startHour: 9, duration: 1.5, reminderAt: "" });
    setShowBlockModal(true);
  };

  const openEditBlock = (block: CalendarBlock) => {
    setEditingBlock(block);
    setBlockForm({
      title: block.title,
      type: block.type,
      day: block.day,
      startHour: block.startHour,
      duration: block.duration,
      reminderAt: block.reminderAt || "",
    });
    setShowBlockModal(true);
  };

  const saveBlock = () => {
    const payload: CalendarBlock = {
      id: editingBlock?.id || uid("block"),
      title: blockForm.title || "Nuevo bloque",
      type: blockForm.type,
      day: blockForm.day,
      startHour: blockForm.startHour,
      duration: blockForm.duration,
      reminderAt: blockForm.reminderAt || undefined,
      color: editingBlock?.color || blockColor(blockForm.type),
    };

    if (editingBlock) {
      setBlocks((prev) => prev.map((block) => (block.id === editingBlock.id ? payload : block)));
    } else {
      setBlocks((prev) => [...prev, payload]);
    }

    setShowBlockModal(false);
    setEditingBlock(null);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: uid("task"), text: newTask.trim(), priority: clamp(prev.length + 1, 1, 5), done: false }].slice(0, 10));
    setNewTask("");
  };

  const addEvaluation = () => {
    setEvaluations((prev) => [
      ...prev,
      {
        id: uid("eval"),
        title: `Nueva evaluación ${prev.length + 1}`,
        dueDate: new Date(Date.now() + (prev.length + 1) * 86400000).toISOString(),
        color: prev.length % 2 === 0 ? "green" : "blue",
      },
    ]);
  };

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleBlockPointerDown = (e: React.PointerEvent, block: CalendarBlock) => {
    if (!calendarRef.current) return;
    setDraggingId(block.id);
    const rect = calendarRef.current.getBoundingClientRect();
    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialDay = block.day;
    const initialStart = block.startHour;

    const onMove = (event: PointerEvent) => {
      const dx = event.clientX - initialX;
      const dy = event.clientY - initialY;
      const dayDelta = Math.round(dx / ((rect.width - 70) / 7));
      const hourDelta = Math.round((dy / hourHeight) / halfHourSnap) * halfHourSnap;
      const newDay = clamp(initialDay + dayDelta, 0, 6);
      const newStart = clamp(initialStart + hourDelta, startHour, endHour - block.duration);
      setBlocks((prev) => prev.map((item) => (item.id === block.id ? { ...item, day: newDay, startHour: newStart } : item)));
    };

    const onUp = () => {
      setDraggingId(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 antialiased">
      <div className="mx-auto max-w-[1600px] p-5 lg:p-7">
        <header className="mb-5 grid grid-cols-[82px_1fr_260px] items-center gap-4 rounded-[32px] bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 backdrop-blur">
          <button className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
            <BookOpen className="h-7 w-7 text-slate-800" />
          </button>

          <div className="flex items-center justify-center rounded-[24px] bg-[#f6f7fb] px-5 py-4 shadow-inner">
            <h1 className="text-center text-2xl font-semibold tracking-tight md:text-4xl">Organizador Universitario</h1>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[24px] bg-[#f6f7fb] px-4 py-3 ring-1 ring-slate-200">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Reloj digital</p>
              <p className="text-xl font-semibold md:text-2xl">{formatClock(now)}</p>
              <p className="text-xs capitalize text-slate-500">{formatDate(now)}</p>
            </div>
            <button className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white shadow-sm ring-1 ring-slate-200">
              <CalendarDays className="h-6 w-6 text-slate-800" />
            </button>
          </div>
        </header>

        <div className="mb-5 rounded-[28px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Frase del día</p>
                <p className="text-base font-semibold md:text-lg">{quoteOfTheDay}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startVoiceRecognition("global")}
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ring-1 ring-slate-200 transition",
                  listening ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-white hover:bg-slate-50"
                )}
              >
                <Mic className="h-4 w-4" />
                {listening ? "Escuchando..." : "Micrófono"}
              </button>
              <button
                onClick={() => setAssistantOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
              >
                <Brain className="h-4 w-4" />
                Asistente IA
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.65fr_0.75fr]">
          <section className="rounded-[30px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80">
            <div className="mb-4 flex items-center justify-between gap-4 px-2 pt-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold">Calendario Semanal</h2>
                <button className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                  Interactivo
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-medium ring-1 ring-slate-200 hover:bg-slate-100">
                  <Clock3 className="h-4 w-4" /> 65%
                </button>
                <button
                  onClick={openCreateBlock}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" /> Agendar bloque
                </button>
              </div>
            </div>

            <div ref={calendarRef} className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-[#fbfbfd]">
              <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-white/80">
                <div className="p-4" />
                {dayNames.map((day) => (
                  <div key={day} className="p-4 text-center text-sm font-semibold text-slate-600 md:text-lg">
                    {day}
                  </div>
                ))}
              </div>

              <div className="relative grid grid-cols-[70px_repeat(7,minmax(0,1fr))]">
                <div className="relative" style={{ height: totalHours * hourHeight }}>
                  {Array.from({ length: totalHours + 1 }).map((_, i) => (
                    <div key={i} className="absolute left-0 right-0" style={{ top: i * hourHeight }}>
                      <div className="-translate-y-1/2 pl-3 text-xs text-slate-400 md:text-sm">
                        {`${startHour + i}:00`}
                      </div>
                    </div>
                  ))}
                </div>

                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div key={dayIndex} className="relative border-l border-slate-200" style={{ height: totalHours * hourHeight }}>
                    {Array.from({ length: totalHours + 1 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn("absolute left-0 right-0 border-t", i % 2 === 0 ? "border-slate-200" : "border-slate-100")}
                        style={{ top: i * hourHeight }}
                      />
                    ))}
                  </div>
                ))}

                <div className="pointer-events-none absolute inset-0 left-[70px]">
                  {blocks.map((block) => {
                    const top = hoursToTop(block.startHour);
                    const height = durationToHeight(block.duration);
                    const left = block.day * dayColumnWidth;
                    const width = dayColumnWidth - 8;
                    return (
                      <motion.div
                        layout
                        key={block.id}
                        initial={false}
                        onPointerDown={(e) => handleBlockPointerDown(e, block)}
                        className={cn(
                          "pointer-events-auto absolute cursor-grab select-none rounded-[22px] border p-3 shadow-sm transition hover:shadow-md",
                          pastelPalette[block.color],
                          draggingId === block.id && "shadow-lg ring-2 ring-slate-300"
                        )}
                        style={{ top, left: left + 4, width, height }}
                      >
                        <div className="flex h-full flex-col justify-between gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold leading-tight md:text-base">{block.title}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">{block.type}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditBlock(block);
                              }}
                              className="rounded-xl bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                            >
                              editar
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {block.startHour.toFixed(1).replace(".5", ":30").replace(".0", ":00")} · {block.duration}h
                            </span>
                            {block.reminderAt && <Bell className="h-4 w-4" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoPill icon={<GraduationCap className="h-4 w-4" />} label="Clases" value={`${blocks.filter((b) => b.type === "Clase").length} bloques`} />
              <InfoPill icon={<Brain className="h-4 w-4" />} label="Estudio" value={`${blocks.filter((b) => b.type === "Estudio").length} sesiones`} />
              <InfoPill icon={<Bell className="h-4 w-4" />} label="Recordatorios" value={`${blocks.filter((b) => b.reminderAt).length + tasks.filter((t) => t.reminderAt).length + evaluations.filter((e) => e.reminderAt).length} activos`} />
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[30px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Tareas Priorizadas</h3>
                <ListChecks className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mb-4 flex gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Agregar tarea"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300"
                />
                <button onClick={addTask} className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => startVoiceRecognition("global")}
                  className={cn(
                    "rounded-2xl px-4 py-3 ring-1 ring-slate-200",
                    listening && voiceMode === "global" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-white"
                  )}
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {sortedTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:bg-white",
                      task.done && "opacity-60"
                    )}
                  >
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white", priorityColors[task.priority])}>
                      {task.priority}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", task.done && "line-through")}>{task.text}</p>
                      {task.reminderAt && <p className="mt-1 text-xs text-slate-400">Con recordatorio</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.done && <Check className="h-4 w-4 text-emerald-600" />}
                      <span className="rounded-xl bg-white px-2 py-1 text-xs font-medium text-sky-600 ring-1 ring-slate-200">
                        {task.priority <= 2 ? "Alta" : task.priority === 3 ? "Media" : "Normal"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Vida Personal y Social</h3>
                <Sparkles className="h-5 w-5 text-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, active: !h.active } : h)))}
                    className={cn(
                      "rounded-[24px] border px-3 py-5 shadow-sm transition",
                      habit.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 hover:bg-white"
                    )}
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                        {iconForHabit(habit.icon)}
                      </div>
                      <span className="text-sm font-medium">{habit.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Evaluaciones Importantes</h3>
                <button onClick={addEvaluation} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium ring-1 ring-slate-200">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2.5">
                {evaluations
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className={cn("rounded-2xl border px-3 py-3", evaluation.color === "green" ? pastelPalette.green : pastelPalette.blue)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-2 h-2.5 w-2.5 rounded-full bg-slate-700" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{evaluation.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(evaluation.dueDate).toLocaleDateString("es-CL", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 ring-1 ring-amber-100">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Foco del día</p>
                  <p className="mt-1 text-base font-semibold leading-relaxed">{quoteOfTheDay}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {showBlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              className="w-full max-w-xl rounded-[30px] bg-white p-5 shadow-2xl ring-1 ring-slate-200"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">{editingBlock ? "Editar bloque" : "Nuevo bloque"}</h3>
                  <p className="text-sm text-slate-500">Arrástralo después en el calendario si quieres ajustarlo visualmente.</p>
                </div>
                <button onClick={() => setShowBlockModal(false)} className="rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Título">
                  <input
                    value={blockForm.title}
                    onChange={(e) => setBlockForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                    placeholder="Ej: Estudiar microeconomía"
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    value={blockForm.type}
                    onChange={(e) => setBlockForm((prev) => ({ ...prev, type: e.target.value as BlockType }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  >
                    <option>Clase</option>
                    <option>Estudio</option>
                    <option>Examen</option>
                    <option>Personal</option>
                  </select>
                </Field>
                <Field label="Día">
                  <select
                    value={blockForm.day}
                    onChange={(e) => setBlockForm((prev) => ({ ...prev, day: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  >
                    {dayNames.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Hora de inicio">
                  <input
                    type="number"
                    min={8}
                    max={21}
                    step={0.5}
                    value={blockForm.startHour}
                    onChange={(e) => setBlockForm((prev) => ({ ...prev, startHour: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  />
                </Field>
                <Field label="Duración (horas)">
                  <input
                    type="number"
                    min={0.5}
                    max={8}
                    step={0.5}
                    value={blockForm.duration}
                    onChange={(e) => setBlockForm((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  />
                </Field>
                <Field label="Recordatorio">
                  <input
                    type="datetime-local"
                    value={blockForm.reminderAt}
                    onChange={(e) => setBlockForm((prev) => ({ ...prev, reminderAt: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  />
                </Field>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                {editingBlock ? (
                  <button
                    onClick={() => {
                      deleteBlock(editingBlock.id);
                      setShowBlockModal(false);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowBlockModal(false)}
                    className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium ring-1 ring-slate-200"
                  >
                    Cancelar
                  </button>
                  <button onClick={saveBlock} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">
                    Guardar bloque
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {assistantOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_60px_rgba(15,23,42,0.16)]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Asistente de IA</p>
                  <p className="text-xs text-white/70">Análisis de carga, estudio y desglose</p>
                </div>
              </div>
              <button onClick={() => setAssistantOpen(false)} className="rounded-2xl bg-white/10 p-2">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
              <div className="grid grid-cols-3 gap-2">
                <QuickPrompt onClick={() => sendToAssistant("Analiza mi semana")}>Analiza mi semana</QuickPrompt>
                <QuickPrompt onClick={() => sendToAssistant("Sugiere mejor horario de estudio")}>Horario de estudio</QuickPrompt>
                <QuickPrompt onClick={() => sendToAssistant("Desglosa preparar presentación grupal")}>Desglosa tarea</QuickPrompt>
              </div>

              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-relaxed shadow-sm",
                      message.role === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200"
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              <div className="flex gap-2">
                <input
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendToAssistant(assistantInput)}
                  placeholder="Escribe o habla con el asistente"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                />
                <button
                  onClick={() => startVoiceRecognition("assistant")}
                  className={cn(
                    "rounded-2xl px-3 ring-1 ring-slate-200",
                    listening && voiceMode === "assistant" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-white"
                  )}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button onClick={() => sendToAssistant(assistantInput)} className="rounded-2xl bg-slate-900 px-4 text-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!assistantOpen && (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-slate-900 px-5 py-4 text-sm font-medium text-white shadow-[0_20px_40px_rgba(15,23,42,0.22)]"
        >
          <MessageSquare className="h-5 w-5" /> Asistente de IA
        </button>
      )}

      <div className="fixed right-5 top-5 z-[60] flex w-[360px] max-w-[calc(100vw-20px)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{toast.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{toast.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">{icon}</div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickPrompt({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
    >
      {children}
    </button>
  );
}
