"use client";
import { useState } from "react";

export default function TestAPI() {
  const [result, setResult] = useState("");
  const [habitId, setHabitId] = useState("");

  const testCreateHabit = async () => {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Morning Exercise" }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
    if (data.data?.id) {
      setHabitId(data.data.id);
    }
  };

  const testGetHabits = async () => {
    const res = await fetch("/api/habits");
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  const testMarkDone = async () => {
    if (!habitId) {
      setResult("Create a habit first to get an ID");
      return;
    }
    const res = await fetch("/api/done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: habitId }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  const testGetDoneRecords = async () => {
    if (!habitId) {
      setResult("Create a habit first to get an ID");
      return;
    }
    const res = await fetch(`/api/done?habit_id=${habitId}`);
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">API Test Page</h1>
        <p className="text-zinc-600 mb-6">Test your Habiti API endpoints</p>

        <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-4">
          <h2 className="text-lg font-semibold mb-3">Habits API</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={testCreateHabit}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Create Habit
            </button>
            <button
              onClick={testGetHabits}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get All Habits
            </button>
          </div>

          {habitId && (
            <p className="text-sm text-zinc-600">
              Current Habit ID:{" "}
              <code className="bg-zinc-100 px-2 py-1 rounded">{habitId}</code>
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-4">
          <h2 className="text-lg font-semibold mb-3">Done Records API</h2>
          <div className="flex gap-2">
            <button
              onClick={testMarkDone}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              disabled={!habitId}
            >
              Mark Habit Done Today
            </button>
            <button
              onClick={testGetDoneRecords}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              disabled={!habitId}
            >
              Get Done Records
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-white font-semibold mb-3">Response:</h2>
          <pre className="text-green-400 text-sm overflow-auto">
            {result || "Click a button to test an endpoint..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
