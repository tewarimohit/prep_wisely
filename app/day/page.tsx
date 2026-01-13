"use client";

import { useState } from "react";
import { Task } from "@/types/microplan";
import TaskTitleSchema from "@/lib/contracts";
import { error, log } from "console";

export default function DayPage() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [tasks, setTasks] = useState([
    {
      id: "1",
      title: "Complete project planning",
      completed: true,
      carriedForward: false,
    },
    {
      id: "2",
      title: "Review documentation",
      completed: true,
      carriedForward: false,
    },
    {
      id: "3",
      title: "Prepare presentation slides",
      completed: false,
      carriedForward: true,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const addTask = () => {
    const result = TaskTitleSchema.safeParse(newTaskTitle);
    console.log("result", result);

    if (!result.success) {
      setTaskError(result.error.issues[0].message);
      return;
    }
    setTaskError(null); // clear prev state
    const title = result.data; // already trimme

    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
        carriedForward: false,
      },
    ]);

    setNewTaskTitle("");
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = (id: string) => {
    const result = TaskTitleSchema.safeParse(editingTitle);
    if (!result.success) {
      setEditError(result.error.issues[0].message);
      return;
    }
    const title = result.data; // trimmed + valid

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, title } : task))
    );
    setEditError(null);
    setEditingTaskId(null); // done editing
    setEditingTitle(""); // clear input
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-gray-600 mb-4">{formattedDate}</div>
      <h1 className="text-3xl font-bold mb-6">
        <strong>Day Plan</strong>
      </h1>
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
      <div className="space-y-3">
        {tasks.map((task) => (
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
    </div>
  );
}
