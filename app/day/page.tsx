"use client";

import { useState } from "react";
import { Task } from "@/types/microplan";

export default function DayPage() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [tasks, setTasks] = useState<Task[]>([
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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-gray-600 mb-4">{formattedDate}</div>
      <h1 className="text-3xl font-bold mb-6">
        <strong>Day Plan</strong>
      </h1>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id}>
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
              <span className="text-lg">{task.title}</span>
              {task.carriedForward && (
                <span className="text-sm text-blue-600">(Carried Forward)</span>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
