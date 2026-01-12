import { z } from "zod";

const TaskTitleSchema = z.string().trim().min(1, "Task title cannot be empty");

export default TaskTitleSchema;
