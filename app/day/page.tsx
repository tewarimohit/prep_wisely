"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types/microplan";
import TaskTitleSchema from "@/lib/contracts";
import formatDate from "@/lib/utils";

// TODO: Replace with auth context userId
const TEST_USER_ID = "cmko9jw0y0002dx23vbn4lnm2";

export default function DayPage() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getNextDate = (dateStr: string): string => {
    const [dd, mm, yyyy] = dateStr.split("/").map(Number);
    const date = new Date(yyyy, mm - 1, dd + 1);
    return formatDate(date);
  };

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [currentDate, setCurrentDate] = useState<string>(
    formatDate(new Date())
  );
  const [viewedDate, setViewedDate] = useState<"today" | "next">("today");
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  type TasksByDate = Record<string, Task[]>;

  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});

  // Convert DD/MM/YYYY to YYYY-MM-DD for API
  const convertDateToApiFormat = (dateStr: string): string => {
    const [dd, mm, yyyy] = dateStr.split("/").map(Number);
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(
      2,
      "0"
    )}`;
  };

  // Fetch plan from backend
  const fetchPlan = async (dateStr: string) => {
    try {
      setIsLoading(true);
      setApiError(null);
      const apiDate = convertDateToApiFormat(dateStr);

      // TODO: Get userId from auth context
      const userId = TEST_USER_ID;

      const response = await fetch(`/api/plans/${apiDate}?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch plan: ${response.status}`);
      }

      const plan = await response.json();

      // If response is null, initialize empty plan state
      if (plan === null) {
        setTasksByDate((prev) => ({
          ...prev,
          [dateStr]: [],
        }));
        return;
      }

      // Map PlanItems to Tasks
      const tasks: Task[] = (plan.items || []).map((item: any) => ({
        id: item.id,
        title: item.text,
        completed: item.status === "DONE",
        carriedForward: false,
      }));

      setTasksByDate((prev) => ({
        ...prev,
        [dateStr]: tasks,
      }));
    } catch (error) {
      setApiError("Failed to load plan. Please refresh the page.");
      // Initialize empty plan on error
      setTasksByDate((prev) => ({
        ...prev,
        [dateStr]: [],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Save plan to backend (server is source of truth)
  const savePlan = async (dateStr: string, tasks: Task[]) => {
    try {
      setApiError(null);
      const apiDate = convertDateToApiFormat(dateStr);
      const userId = TEST_USER_ID;

      // Convert Tasks to PlanItems format
      const items = tasks.map((task, index) => ({
        text: task.title,
        status: task.completed ? "DONE" : "TODO",
        order: index,
        tags: [],
        dueTime: null,
      }));

      const payload = {
        title: "Daily Plan", // TODO: Make title editable
        items,
      };

      const response = await fetch(`/api/plans/${apiDate}?userId=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to save plan: ${response.status}`
        );
      }

      const plan = await response.json();

      // Update UI state from API response (server = source of truth)
      const updatedTasks: Task[] = (plan.items || []).map((item: any) => ({
        id: item.id,
        title: item.text,
        completed: item.status === "DONE",
        carriedForward: false,
      }));

      setTasksByDate((prev) => ({
        ...prev,
        [dateStr]: updatedTasks,
      }));
    } catch (error: any) {
      setApiError(error.message || "Failed to save plan. Please try again.");
      // Re-fetch on error to sync with server
      fetchPlan(dateStr);
    }
  };

  // Fetch plan on mount and when activeDate changes
  useEffect(() => {
    const activeDate =
      viewedDate === "today" ? currentDate : getNextDate(currentDate);
    fetchPlan(activeDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewedDate]);

  const nextDate = getNextDate(currentDate);

  const todayTasks = tasksByDate[currentDate] ?? [];
  const nextDayTasks = tasksByDate[nextDate] ?? [];

  const activeDate = viewedDate === "today" ? currentDate : nextDate;
  const activeTasks = tasksByDate[activeDate] ?? [];

  const toggleTask = async (id: string) => {
    const updatedTasks = (tasksByDate[activeDate] ?? []).map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    await savePlan(activeDate, updatedTasks);
  };

  const addTask = async () => {
    const result = TaskTitleSchema.safeParse(newTaskTitle);

    if (!result.success) {
      setTaskError(result.error.issues[0].message);
      return;
    }
    setTaskError(null);
    const title = result.data;

    const newTask: Task = {
      id: crypto.randomUUID(), // Temporary ID, will be replaced by server
      title,
      completed: false,
      carriedForward: false,
    };

    const updatedTasks = [...(tasksByDate[activeDate] ?? []), newTask];
    await savePlan(activeDate, updatedTasks);
    setNewTaskTitle("");
  };

  const deleteTask = async (id: string) => {
    const updatedTasks = (tasksByDate[activeDate] ?? []).filter(
      (task) => task.id !== id
    );
    await savePlan(activeDate, updatedTasks);
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = async (id: string) => {
    const result = TaskTitleSchema.safeParse(editingTitle);
    if (!result.success) {
      setEditError(result.error.issues[0].message);
      return;
    }
    const title = result.data;

    const updatedTasks = (tasksByDate[activeDate] ?? []).map((task) =>
      task.id === id ? { ...task, title } : task
    );

    await savePlan(activeDate, updatedTasks);
    setEditError(null);
    setEditingTaskId(null);
    setEditingTitle("");
  };

  const carryForwardTasks = async () => {
    const todayTasks = tasksByDate[currentDate] ?? [];

    // 1. pick only incomplete tasks
    const incompleteTasks = todayTasks.filter((task) => !task.completed);

    // 2. clone them for next day
    const carriedTasks = incompleteTasks.map((task) => ({
      ...task,
      id: crypto.randomUUID(), // Temporary ID, will be replaced by server
      carriedForward: true,
      completed: false,
    }));

    // Save next day plan with carried forward tasks
    const nextDayTasks = [...(tasksByDate[nextDate] ?? []), ...carriedTasks];
    await savePlan(nextDate, nextDayTasks);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-gray-600 mb-4">{formattedDate}</div>
      <h1 className="text-3xl font-bold mb-6">
        <strong>Day Plan</strong>
      </h1>
      {isLoading && <div className="text-gray-500 mb-4">Loading plan...</div>}
      {apiError && (
        <div className="text-red-600 mb-4 bg-red-50 border border-red-200 px-4 py-2 rounded">
          {apiError}
        </div>
      )}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => {
            setNewTaskTitle(e.target.value);
            if (taskError) {
              setTaskError(null);
            }
          }}
          placeholder="Add a new task"
          className="border px-3 py-2 flex-1"
        />
        <button onClick={addTask} className="border px-4 py-2">
          Add Task
        </button>
      </div>
      {taskError && (
        <div className="text-sm mb-4 text-red-600">{taskError}</div>
      )}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewedDate("today")}
          className="border px-3 py-1"
        >
          Today
        </button>

        <button
          onClick={() => setViewedDate("next")}
          className="border px-3 py-1"
        >
          Next Day
        </button>
      </div>
      <div className="space-y-3">
        {activeTasks.map((task) => (
          <div className="flex items-center gap-2" key={task.id}>
            <label
              className={`flex items-center gap-2 cursor-pointer ${
                task.completed ? "line-through opacity-60" : "opacity-100"
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="w-4 h-4 cursor-pointer"
              />
              {editingTaskId === task.id ? (
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => {
                      setEditingTitle(e.target.value);
                      if (editError) setEditError(null);
                    }}
                    onBlur={() => saveEdit(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // avoid accidental form submit
                        saveEdit(task.id);
                      }
                    }}
                    autoFocus
                    className="border px-2 py-1 text-lg"
                  />
                  {editError && (
                    <span className="text-sm text-red-600">{editError}</span>
                  )}
                </div>
              ) : (
                <span
                  className="text-lg cursor-pointer"
                  onDoubleClick={() => startEditing(task)}
                >
                  {task.title}
                </span>
              )}
              {task.carriedForward && (
                <span className="text-sm text-blue-600">(Carried Forward)</span>
              )}
            </label>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-sm text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      <button onClick={carryForwardTasks} className="border px-4 py-2 mt-6">
        Move to Next Day
      </button>
    </div>
  );
}
