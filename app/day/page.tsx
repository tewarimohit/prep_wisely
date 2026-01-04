import { Task } from "@/types/microplan";

export default function DayPage() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tasks: Task[] = [
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
  ];

  return (
    <div>
      <div>{formattedDate}</div>
      <h1>
        <strong>Day Plan</strong>
      </h1>
      <div>
        {tasks.map((task) => (
          <div key={task.id}>
            <div>
              <input type="checkbox" checked={task.completed} readOnly />
              <span>{task.title}</span>
              {task.carriedForward && <span> (Carried Forward)</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
