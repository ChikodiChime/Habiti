"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  CheckCircle2,
  Trash2,
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
  created_at: string;
}

export default function HabitDetail() {
  const params = useParams();
  const router = useRouter();
  const habitId = params.id as string;

  const [habit, setHabit] = useState<Habit | null>(null);
  const [doneRecords, setDoneRecords] = useState<DoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    if (habitId) {
      fetchHabit();
      fetchDoneRecords();
    }
  }, [habitId]);

  const fetchHabit = async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      const habits = data.data || [];
      const found = habits.find((h: Habit) => h.id === habitId);
      setHabit(found || null);
    } catch (error) {
      console.error("Failed to fetch habit:", error);
    }
  };

  const fetchDoneRecords = async () => {
    try {
      const res = await fetch(`/api/done?habit_id=${habitId}`);
      const data = await res.json();
      setDoneRecords(data.data || []);
    } catch (error) {
      console.error("Failed to fetch done records:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsDone = async () => {
    if (!habit) return;

    setMarkingDone(true);
    try {
      const res = await fetch("/api/done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId }),
      });
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // POST returns the record directly (not nested under data.data)
      const newRecord: DoneRecord = {
        id: data.id,
        habit_id: data.habit_id,
        date_done: data.date_done,
        created_at: data.created_at,
      };
      setDoneRecords((prev) => [newRecord, ...prev]);

      // Update streak counts from the response
      if (data.updated_streaks) {
        setHabit((prev) =>
          prev
            ? {
                ...prev,
                current_streak: data.updated_streaks.current_streak,
                longest_streak: data.updated_streaks.longest_streak,
              }
            : prev,
        );
      }

      // Streak milestone toasts
      const newStreak = data.updated_streaks?.current_streak ?? 0;
      const milestones: Record<number, string> = {
        3: "3-day streak! You're building momentum 🔥",
        7: "7-day streak! One full week — incredible! 🎯",
        14: "14-day streak! Two weeks strong 💪",
        30: "30-day streak! A whole month! 🏆",
        100: "100-day streak! You're unstoppable 🌟",
      };
      if (milestones[newStreak]) {
        toast.success(milestones[newStreak], { duration: 5000 });
      } else {
        toast.success(`${habit.name} — done for today! 🔥`);
      }
    } catch (error) {
      console.error("Failed to mark as done:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setMarkingDone(false);
    }
  };

  const deleteHabit = async () => {
    setShowDeleteModal(false);
    try {
      const res = await fetch(`/api/habits?id=${habitId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`"${habit?.name}" deleted.`);
        router.push("/dashboard");
      }
    } catch {
      toast.error("Failed to delete habit.");
    }
  };

  const isDoneToday = () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return doneRecords.some((record) => record.date_done === today);
  };

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const doneDatesSet = new Set(doneRecords.map((record) => record.date_done));

  const buildCalendarDays = () => {
    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const end = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    const days: (Date | null)[] = [];
    const offset = start.getDay();

    for (let i = 0; i < offset; i++) {
      days.push(null);
    }

    for (let d = 1; d <= end.getDate(); d++) {
      days.push(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d),
      );
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  };

  const calendarDays = buildCalendarDays();

  const _todayD = new Date();
  const todayStr = `${_todayD.getFullYear()}-${String(_todayD.getMonth() + 1).padStart(2, "0")}-${String(_todayD.getDate()).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-sm text-slate-400">Loading habit...</span>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center text-slate-200">
          <h2 className="text-xl font-semibold">Habit not found</h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-[0_14px_40px_rgba(249,115,22,0.55)] transition hover:bg-orange-400"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const doneToday = isDoneToday();

  return (
    <>
      <ConfirmModal
        open={showDeleteModal}
        title={`Delete "${habit.name}"?`}
        description="This will permanently remove the habit and all its history and streaks. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={deleteHabit}
        onCancel={() => setShowDeleteModal(false)}
      />
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
          <motion.button
            type="button"
            onClick={() => router.push("/dashboard")}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10 transition hover:text-slate-100 hover:ring-orange-500/40"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-orange-400" />
            Back
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-400/70 ring-1 ring-white/10 transition hover:bg-red-500/10 hover:text-red-400 hover:ring-red-500/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </motion.button>
        </div>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-linear-to-br from-slate-900 via-slate-900 to-slate-800"
        >
          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/80">
                  Habit
                </p>
                <h1 className="mt-1.5 sm:mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl lg:text-4xl">
                  {habit.name}
                </h1>
                <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-slate-500">
                  Since{" "}
                  {new Date(habit.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <motion.button
                type="button"
                onClick={markAsDone}
                disabled={doneToday || markingDone}
                whileHover={!doneToday && !markingDone ? { scale: 1.03 } : {}}
                whileTap={!doneToday && !markingDone ? { scale: 0.97 } : {}}
                className={`shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold transition ${
                  doneToday
                    ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 cursor-default"
                    : markingDone
                      ? "bg-orange-400/80 text-white cursor-wait"
                      : "bg-orange-500 text-white shadow-[0_8px_32px_rgba(249,115,22,0.5)] hover:bg-orange-400 hover:shadow-[0_12px_40px_rgba(249,115,22,0.65)]"
                }`}
              >
                {doneToday ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Done today
                  </>
                ) : markingDone ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{" "}
                    Saving...
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4" /> Mark done today
                  </>
                )}
              </motion.button>
            </div>

            {/* Stats row */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x sm:divide-white/10 border-t border-white/10 pt-5 sm:pt-6">
              <div className="flex items-center gap-3 sm:block sm:pr-6">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <Flame className="h-3 w-3 text-orange-400" />
                  Current streak
                </div>
                <div className="ml-auto sm:ml-0 sm:mt-2 text-2xl sm:text-3xl font-bold text-orange-400">
                  {habit.current_streak}
                  <span className="ml-1 text-xs sm:text-sm font-normal text-slate-500">
                    days
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:block sm:px-6">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  Best streak
                </div>
                <div className="ml-auto sm:ml-0 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-50">
                  {habit.longest_streak}
                  <span className="ml-1 text-xs sm:text-sm font-normal text-slate-500">
                    days
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:block sm:pl-6">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Total done
                </div>
                <div className="ml-auto sm:ml-0 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-50">
                  {doneRecords.length}
                  <span className="ml-1 text-xs sm:text-sm font-normal text-slate-500">
                    days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two-column: calendar + history */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Calendar — wider */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="lg:col-span-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-orange-400" />
                <h2 className="text-sm font-semibold text-slate-50">
                  {monthLabel}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() =>
                    setCurrentMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-orange-500/50 hover:text-slate-200"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() =>
                    setCurrentMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-orange-500/50 hover:text-slate-200"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-600">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} className="h-8" />;
                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                const isDone = doneDatesSet.has(dateStr);
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;

                let cls =
                  "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full mx-auto text-[11px] sm:text-xs transition";

                if (isDone) {
                  cls +=
                    " bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.45)]";
                  if (isToday)
                    cls +=
                      " ring-2 ring-offset-1 ring-offset-slate-900 ring-white/40";
                } else if (isToday) {
                  cls +=
                    " border-2 border-orange-500/60 text-orange-300 bg-transparent";
                } else if (isFuture) {
                  cls += " text-slate-700 cursor-default";
                } else {
                  cls +=
                    " text-slate-500 hover:bg-slate-800 hover:text-slate-300";
                }

                return (
                  <div
                    key={dateStr}
                    className="flex items-center justify-center"
                  >
                    <div className={cls}>{day.getDate()}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                Done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-orange-500/60" />
                Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                Missed
              </span>
            </div>
          </motion.div>

          {/* History — narrower */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-6"
          >
            <h2 className="mb-4 text-sm font-semibold text-slate-50">
              Recent history
            </h2>
            {doneRecords.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Flame className="h-8 w-8 text-slate-700" />
                <p className="text-sm text-slate-500">
                  No records yet.
                  <br />
                  Start your streak today!
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                {doneRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-slate-800/60"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-200">
                        {new Date(
                          record.date_done + "T12:00:00",
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {new Date(
                          record.date_done + "T12:00:00",
                        ).toLocaleDateString("en-US", { weekday: "long" })}
                      </p>
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
                      <CheckCircle2 className="h-3 w-3" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
