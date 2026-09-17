/**
 * Department routing policy.
 *
 * Citizens never choose a department. The AI (or the rule-based fallback)
 * suggests category codes; this versioned policy map resolves the accountable
 * department and any contributing departments. The model never invents an
 * office: only codes listed here can be routed to.
 */

export const ROUTING_POLICY_VERSION = "routing-v1";

export const CATEGORY_CODES = [
  "water",
  "roads",
  "electricity",
  "sanitation",
  "drainage",
  "safety",
  "health",
  "other",
] as const;

export type CategoryCode = (typeof CATEGORY_CODES)[number];

export function isCategoryCode(value: unknown): value is CategoryCode {
  return typeof value === "string" && (CATEGORY_CODES as readonly string[]).includes(value);
}

/**
 * Departments that routinely contribute when a problem of this category is
 * confirmed. Example: a pipeline leak is owned by Water Supply, while Roads
 * restores the damaged surface and Sanitation clears the resulting mess.
 */
const SUPPORTING_BY_CATEGORY: Record<CategoryCode, CategoryCode[]> = {
  water: ["roads", "sanitation"],
  drainage: ["sanitation", "health"],
  sanitation: ["health"],
  roads: ["safety"],
  electricity: ["safety"],
  safety: [],
  health: ["sanitation"],
  other: [],
};

export type RoutedDepartment = {
  code: CategoryCode;
  role: "primary" | "supporting";
  reason: string;
};

/**
 * Resolve the accountable department plus contributing departments.
 * One accountable owner is always assigned, even with several contributors.
 */
export function resolveDepartments(
  category: CategoryCode,
  supportingCategories: string[] = [],
): RoutedDepartment[] {
  const primary: RoutedDepartment = {
    code: category,
    role: "primary",
    reason: `Accountable owner for category "${category}" under ${ROUTING_POLICY_VERSION}.`,
  };

  const extra = new Set<CategoryCode>();
  for (const code of SUPPORTING_BY_CATEGORY[category]) extra.add(code);
  for (const code of supportingCategories) {
    if (isCategoryCode(code)) extra.add(code);
  }
  extra.delete(category);
  extra.delete("other");

  const supporting: RoutedDepartment[] = [...extra].map((code) => ({
    code,
    role: "supporting" as const,
    reason: `Contributing work expected for a "${category}" issue.`,
  }));

  return [primary, ...supporting];
}
