import { AIDayPlan } from "@/lib/contracts/aiPlanner";

/**
 * Diff result structure
 */
export interface PlanDiff {
  added: Array<{ text: string; order: number }>;
  removed: Array<{ text: string; order: number }>;
  reordered: Array<{ text: string; oldOrder: number; newOrder: number }>;
}

/**
 * Compare two AI plans and compute diff
 * Simple comparison: task titles, count, ordering
 */
export function computePlanDiff(
  currentPlan: AIDayPlan | null,
  newPlan: AIDayPlan
): PlanDiff {
  const diff: PlanDiff = {
    added: [],
    removed: [],
    reordered: [],
  };

  // If no current plan, all items are added
  if (!currentPlan) {
    diff.added = newPlan.items.map((item) => ({
      text: item.text,
      order: item.order,
    }));
    return diff;
  }

  // Create maps for quick lookup
  const currentItemsByText = new Map<string, { text: string; order: number }>();
  currentPlan.items.forEach((item) => {
    currentItemsByText.set(item.text, { text: item.text, order: item.order });
  });

  const newItemsByText = new Map<string, { text: string; order: number }>();
  newPlan.items.forEach((item) => {
    newItemsByText.set(item.text, { text: item.text, order: item.order });
  });

  // Find added items (in new but not in current)
  newPlan.items.forEach((item) => {
    if (!currentItemsByText.has(item.text)) {
      diff.added.push({ text: item.text, order: item.order });
    }
  });

  // Find removed items (in current but not in new)
  currentPlan.items.forEach((item) => {
    if (!newItemsByText.has(item.text)) {
      diff.removed.push({ text: item.text, order: item.order });
    }
  });

  // Find reordered items (same text but different order)
  currentPlan.items.forEach((currentItem) => {
    const newItem = newItemsByText.get(currentItem.text);
    if (newItem && newItem.order !== currentItem.order) {
      diff.reordered.push({
        text: currentItem.text,
        oldOrder: currentItem.order,
        newOrder: newItem.order,
      });
    }
  });

  return diff;
}

/**
 * Check if plans are identical (no diff)
 */
export function plansAreIdentical(
  currentPlan: AIDayPlan | null,
  newPlan: AIDayPlan
): boolean {
  if (!currentPlan) {
    return false;
  }

  if (currentPlan.items.length !== newPlan.items.length) {
    return false;
  }

  // Check if all items match (same text and order)
  const currentTexts = currentPlan.items
    .sort((a, b) => a.order - b.order)
    .map((item) => item.text);
  const newTexts = newPlan.items
    .sort((a, b) => a.order - b.order)
    .map((item) => item.text);

  return (
    currentTexts.length === newTexts.length &&
    currentTexts.every((text, index) => text === newTexts[index])
  );
}
