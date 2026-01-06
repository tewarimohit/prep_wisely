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
    <div>
      <div>{formattedDate}</div>
      <h1>
        <strong>Day Plan</strong>
      </h1>
      <div>
        {tasks.map((task) => (
          <div key={task.id}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: task.completed ? "line-through" : "none",
                opacity: task.completed ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />
              <span>{task.title}</span>
              {task.carriedForward && <span>(Carried Forward)</span>}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
