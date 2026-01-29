"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Task } from "@/types/microplan";
import TaskTitleSchema from "@/lib/contracts";
import formatDate from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { usePlan, planQueryKey } from "@/hooks/usePlan";
import { usePlanMutation } from "@/hooks/usePlanMutation";
import { planToTasks } from "@/lib/transformers";

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY format
 */
function convertApiDateToDisplayFormat(apiDate: string): string {
  const [yyyy, mm, dd] = apiDate.split("-").map(Number);
  return formatDate(new Date(yyyy, mm - 1, dd));
}

export default function DayPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  // Convert date param (YYYY-MM-DD) to display format (DD/MM/YYYY) or use today
  const initialDate = dateParam
    ? convertApiDateToDisplayFormat(dateParam)
    : formatDate(new Date());

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
  const [currentDate, setCurrentDate] = useState<string>(initialDate);
  const [viewedDate, setViewedDate] = useState<"today" | "next">("today");
  const [apiError, setApiError] = useState<string | null>(null);

  // Update currentDate when date param changes
  useEffect(() => {
    if (dateParam) {
      const convertedDate = convertApiDateToDisplayFormat(dateParam);
      setCurrentDate(convertedDate);
      setViewedDate("today"); // Reset to "today" view when date param changes
    } else {
      // Default to today if no date param
      const todayDate = formatDate(new Date());
      setCurrentDate(todayDate);
      setViewedDate("today");
    }
  }, [dateParam]);

  const queryClient = useQueryClient();

  // Calculate active date
  const nextDate = getNextDate(currentDate);
  const activeDate = viewedDate === "today" ? currentDate : nextDate;

  // Format the displayed date based on currentDate
  const getFormattedDate = (dateStr: string): string => {
    const [dd, mm, yyyy] = dateStr.split("/").map(Number);
    const date = new Date(yyyy, mm - 1, dd);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formattedDate = getFormattedDate(currentDate);

  // Use usePlan hook to fetch plan
  const {
    data: plan,
    isLoading,
    error: queryError,
  } = usePlan(activeDate);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      setApiError("Failed to load plan. Please refresh the page.");
    } else {
      setApiError(null);
    }
  }, [queryError]);

  // Use usePlanMutation hook for upserting plan
  const upsertPlanMutation = usePlanMutation(
    () => {
      // Clear error on successful mutation
      setApiError(null);
    },
    (errorMessage) => {
      setApiError(errorMessage);
    }
  );

  // Derive tasks directly from plan
  const activeTasks = planToTasks(plan);

  const toggleTask = async (id: string) => {
    const updatedTasks = activeTasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    upsertPlanMutation.mutate({ dateStr: activeDate, tasks: updatedTasks });
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

    const updatedTasks = [...activeTasks, newTask];
    upsertPlanMutation.mutate({ dateStr: activeDate, tasks: updatedTasks });
    setNewTaskTitle("");
  };

  const deleteTask = async (id: string) => {
    const updatedTasks = activeTasks.filter((task) => task.id !== id);
    upsertPlanMutation.mutate({ dateStr: activeDate, tasks: updatedTasks });
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

    const updatedTasks = activeTasks.map((task) =>
      task.id === id ? { ...task, title } : task
    );

    upsertPlanMutation.mutate({ dateStr: activeDate, tasks: updatedTasks });
    setEditError(null);
    setEditingTaskId(null);
    setEditingTitle("");
  };

  const carryForwardTasks = async () => {
    // Get today's plan from cache
    const todayPlan = queryClient.getQueryData(planQueryKey(currentDate));
    const todayTasks = planToTasks(todayPlan);

    // 1. pick only incomplete tasks
    const incompleteTasks = todayTasks.filter((task) => !task.completed);

    // 2. clone them for next day
    const carriedTasks = incompleteTasks.map((task) => ({
      ...task,
      id: crypto.randomUUID(), // Temporary ID, will be replaced by server
      carriedForward: true,
      completed: false,
    }));

    // Get next day's plan from cache
    const nextDayPlan = queryClient.getQueryData(planQueryKey(nextDate));
    const nextDayTasks = planToTasks(nextDayPlan);

    // Save next day plan with carried forward tasks
    upsertPlanMutation.mutate({
      dateStr: nextDate,
      tasks: [...nextDayTasks, ...carriedTasks],
    });
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
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  Carried Forward
                </span>
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
