"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Flame,
  ChevronRight,
  Trash2,
  CalendarDays,
  ChevronLeft,
  X,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/src/components/ConfirmModal";

interface Habit {
  id: string;
  name: string;
  current_streak: number;
  longest_streak: number;
  created_at: string;
}

interface DoneRecord {
  id: string;
  habit_id: string;
  date_done: string;
}

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const [allDoneRecords, setAllDoneRecords] = useState<DoneRecord[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [habitsPage, setHabitsPage] = useState(1);
  const HABITS_PER_PAGE = 6;
  const [markingDoneId, setMarkingDoneId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchHabits();
    fetchAllDoneRecords();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      setHabits(data.data || []);
    } catch (error) {
      console.error("Failed to fetch habits:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDoneRecords = async () => {
    try {
      const res = await fetch("/api/done/all");
      if (res.ok) {
        const data = await res.json();
        setAllDoneRecords(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch done records:", error);
    }
  };

  // Calendar helpers
  const calendarMonthLabel = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const buildCalendarDays = () => {
    const start = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    );
    const end = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0,
    );
    const days: (Date | null)[] = [];
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let d = 1; d <= end.getDate(); d++)
      days.push(
        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d),
      );
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const calendarDays = buildCalendarDays();
  const _today = new Date();
  const todayStr = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, "0")}-${String(_today.getDate()).padStart(2, "0")}`;

  // Map: date -> array of {id, name} for habits done that day
  const doneByDate = allDoneRecords.reduce<
    Record<string, { id: string; name: string }[]>
  >((acc, record) => {
    const habit = habits.find((h) => h.id === record.habit_id);
    if (!habit) return acc;
    if (!acc[record.date_done]) acc[record.date_done] = [];
    if (!acc[record.date_done].some((h) => h.id === habit.id))
      acc[record.date_done].push({ id: habit.id, name: habit.name });
    return acc;
  }, {});

  const selectedHabits = selectedDate ? (doneByDate[selectedDate] ?? []) : [];

  const doneTodaySet = new Set(
    allDoneRecords
      .filter((r) => r.date_done === todayStr)
      .map((r) => r.habit_id),
  );

  const markHabitDone = async (habit: Habit) => {
    if (markingDoneId) return;
    setMarkingDoneId(habit.id);
    try {
      const res = await fetch("/api/done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habit.id }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setAllDoneRecords((prev) => [data, ...prev]);
      if (data.updated_streaks) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id
              ? {
                  ...h,
                  current_streak: data.updated_streaks.current_streak,
                  longest_streak: data.updated_streaks.longest_streak,
                }
              : h,
          ),
        );
      }
      const newStreak = data.updated_streaks?.current_streak ?? 0;
      const milestones: Record<number, string> = {
        3: "3-day streak! 🔥",
        7: "7-day streak! 🎯",
        14: "14-day streak! 💪",
        30: "30-day streak! 🏆",
      };
      toast.success(
        milestones[newStreak] ?? `${habit.name} — done for today! 🔥`,
      );
    } catch {
      toast.error("Failed to mark as done.");
    } finally {
      setMarkingDoneId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setHabits((prev) => prev.filter((h) => h.id !== id));
        toast.success(`"${name}" deleted.`);
      }
    } catch {
      toast.error("Failed to delete habit.");
    }
  };

  const createHabit = async (name: string) => {
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.data) {
        setHabits((prev) => [data.data, ...prev]);
        toast.success(`"${name}" added!`);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Failed to create habit:", error);
      toast.error("Failed to create habit. Please try again.");
    }
  };

  return (
    <>
      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove the habit and all its history and streaks. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Date detail modal */}
      <AnimatePresence>
        {selectedDate && (
          <>
            <motion.div
              key="date-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedDate(null)}
            />
            <motion.div
              key="date-modal"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/80">
                    Activity
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-50">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {selectedHabits.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CalendarDays className="h-8 w-8 text-slate-600" />
                  <p className="text-sm text-slate-500">
                    No habits completed on this day.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {selectedHabits.map((habit) => (
                    <li key={habit.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(null);
                          router.push(`/dashboard/habits/${habit.id}`);
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 transition hover:bg-slate-700/70 hover:text-slate-50"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-400" />
                        <span className="flex-1 text-left">{habit.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600 transition group-hover:text-orange-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-center text-xs text-slate-600">
                {selectedHabits.length} of {habits.length} habit
                {habits.length !== 1 ? "s" : ""} completed
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
            Your habits
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Keep the chain unbroken.
          </p>
        </motion.header>

        <section className="mb-8">
          <AddHabitForm onAdd={createHabit} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:items-start">
          {/* Habits list (main content) */}
          <section className="mb-10 lg:mb-0">
            {loading ? (
              <div className="flex min-h-[20vh] items-center justify-center text-slate-400 text-sm">
                Loading your habits...
              </div>
            ) : (
              <div className="grid gap-4">
                {habits.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 text-slate-400"
                  >
                    <p>
                      No habits yet. Create your first one to start your streak.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <AnimatePresence>
                      {habits
                        .slice(
                          (habitsPage - 1) * HABITS_PER_PAGE,
                          habitsPage * HABITS_PER_PAGE,
                        )
                        .map((habit) => (
                          <HabitCard
                            key={habit.id}
                            habit={habit}
                            doneToday={doneTodaySet.has(habit.id)}
                            marking={markingDoneId === habit.id}
                            onClick={() =>
                              router.push(`/dashboard/habits/${habit.id}`)
                            }
                            onDelete={() => setDeleteTarget(habit)}
                            onMarkDone={() => markHabitDone(habit)}
                          />
                        ))}
                    </AnimatePresence>
                    {habits.length > HABITS_PER_PAGE && (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <motion.button
                          type="button"
                          disabled={habitsPage === 1}
                          onClick={() => setHabitsPage((p) => p - 1)}
                          whileHover={habitsPage > 1 ? { x: -2 } : {}}
                          whileTap={habitsPage > 1 ? { scale: 0.96 } : {}}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 ring-1 ring-white/10 transition hover:text-slate-200 hover:ring-orange-500/40 disabled:opacity-30 disabled:cursor-default"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Prev
                        </motion.button>
                        <span className="text-xs text-slate-500">
                          Page {habitsPage} of{" "}
                          {Math.ceil(habits.length / HABITS_PER_PAGE)}
                        </span>
                        <motion.button
                          type="button"
                          disabled={
                            habitsPage >=
                            Math.ceil(habits.length / HABITS_PER_PAGE)
                          }
                          onClick={() => setHabitsPage((p) => p + 1)}
                          whileHover={
                            habitsPage <
                            Math.ceil(habits.length / HABITS_PER_PAGE)
                              ? { x: 2 }
                              : {}
                          }
                          whileTap={
                            habitsPage <
                            Math.ceil(habits.length / HABITS_PER_PAGE)
                              ? { scale: 0.96 }
                              : {}
                          }
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 ring-1 ring-white/10 transition hover:text-slate-200 hover:ring-orange-500/40 disabled:opacity-30 disabled:cursor-default"
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          {/* Activity Calendar — aside on the right */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35, ease: "easeOut" }}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 lg:sticky lg:top-24"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-orange-400" />
                <h2 className="text-xs font-semibold text-slate-50">
                  {calendarMonthLabel}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setCalendarMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                    )
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-orange-500/60 hover:text-slate-100"
                >
                  <ChevronLeft className="h-3 w-3" />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setCalendarMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                    )
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-orange-500/60 hover:text-slate-100"
                >
                  <ChevronRight className="h-3 w-3" />
                </motion.button>
              </div>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-medium uppercase tracking-wide text-slate-600">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} className="h-7" />;
                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                const doneCount = (doneByDate[dateStr] ?? []).length;
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;

                let cls =
                  "relative flex h-7 w-7 mx-auto flex-col items-center justify-center rounded-lg text-[11px] transition select-none";

                if (isFuture) {
                  cls += " text-slate-700 cursor-default";
                } else {
                  cls += " cursor-pointer";
                  if (doneCount > 0) {
                    cls +=
                      " bg-orange-500 text-white shadow-[0_2px_8px_rgba(249,115,22,0.4)]";
                    if (isToday) cls += " ring-2 ring-white/30";
                  } else if (isToday) {
                    cls +=
                      " border border-orange-500/60 text-orange-300 bg-slate-900 hover:bg-slate-800";
                  } else {
                    cls +=
                      " text-slate-500 hover:bg-slate-800/80 hover:text-slate-300";
                  }
                }

                return (
                  <div
                    key={dateStr}
                    className="flex items-center justify-center py-0.5"
                    onClick={() => !isFuture && setSelectedDate(dateStr)}
                  >
                    <div className={cls}>
                      <span>{day.getDate()}</span>
                      {doneCount > 1 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-orange-300 text-[7px] font-bold text-orange-900">
                          {doneCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Done
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full border border-orange-500/60" />
                Today
              </span>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
}

function AddHabitForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await onAdd(name.trim());
    setName("");
    setIsSubmitting(false);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:gap-2"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name a habit you care about..."
        className="flex-1 rounded-xl border border-transparent bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-0 transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/40"
      />
      <motion.button
        type="submit"
        disabled={!name.trim() || isSubmitting}
        whileHover={name.trim() && !isSubmitting ? { scale: 1.02 } : {}}
        whileTap={name.trim() && !isSubmitting ? { scale: 0.97 } : {}}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-[0_12px_35px_rgba(249,115,22,0.5)] transition hover:bg-orange-400 hover:shadow-[0_16px_45px_rgba(249,115,22,0.7)] disabled:opacity-60 disabled:shadow-none"
      >
        <Plus className="h-4 w-4" />
        {isSubmitting ? "Adding..." : "Add Habit"}
      </motion.button>
    </motion.form>
  );
}

function HabitCard({
  habit,
  doneToday,
  marking,
  onClick,
  onDelete,
  onMarkDone,
}: {
  habit: Habit;
  doneToday: boolean;
  marking: boolean;
  onClick: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-orange-500/60 hover:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-50 sm:text-lg">
            {habit.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Started {new Date(habit.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-2xl font-semibold text-orange-400">
              <Flame className="h-5 w-5" />
              {habit.current_streak}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
              day streak
            </div>
          </div>
          {/* Mark done button */}
          <button
            type="button"
            disabled={doneToday || marking}
            onClick={(e) => {
              e.stopPropagation();
              onMarkDone();
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
              doneToday
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 cursor-default"
                : marking
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-400 cursor-wait"
                  : "border-white/10 text-slate-600 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400 opacity-0 group-hover:opacity-100"
            }`}
            title={doneToday ? "Done today" : "Mark as done"}
          >
            {marking ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-400/30 border-t-orange-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:text-orange-400" />
        </div>
      </div>
    </motion.div>
  );
}
