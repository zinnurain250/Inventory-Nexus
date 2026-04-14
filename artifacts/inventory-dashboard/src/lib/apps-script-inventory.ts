const DEFAULT_INVENTORY_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzd4At0brYUEutIj7Ae8cLTmsx5OnFqg4cnfWftNRQWGxdbkSCFwFyiwKdzstx8GxjrNQ/exec";

export const inventoryAppsScriptUrl =
  import.meta.env.VITE_INVENTORY_APPS_SCRIPT_URL?.trim() || DEFAULT_INVENTORY_APPS_SCRIPT_URL;

export const hasInventoryAppsScriptUrl = Boolean(inventoryAppsScriptUrl);

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  reorderLevel: number;
  location: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryWriteInput = {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  reorderLevel: number;
  location: string;
};

type AppsScriptResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function normalizeInventoryItem(item: Partial<InventoryItem>): InventoryItem {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    sku: String(item.sku ?? ""),
    category: String(item.category ?? "Other"),
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    costPrice: Number(item.costPrice ?? 0),
    reorderLevel: Number(item.reorderLevel ?? 0),
    location: String(item.location ?? ""),
    createdAt: String(item.createdAt ?? ""),
    updatedAt: String(item.updatedAt ?? item.createdAt ?? ""),
  };
}

async function parseAppsScriptResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${fallbackMessage} (${response.status} ${response.statusText})`);
  }

  const result = (await response.json()) as AppsScriptResponse<T>;
  if (!result.success) {
    throw new Error(result.error || fallbackMessage);
  }

  return result.data as T;
}

export async function listInventoryFromAppsScript(): Promise<InventoryItem[]> {
  const response = await fetch(`${inventoryAppsScriptUrl}?action=list`, { method: "GET" });
  const data = await parseAppsScriptResponse<Partial<InventoryItem>[]>(response, "Failed to load inventory");
  return (data || []).map(normalizeInventoryItem);
}

export async function createInventoryViaAppsScript(data: InventoryWriteInput): Promise<InventoryItem> {
  const response = await fetch(inventoryAppsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "create", data }),
  });

  return normalizeInventoryItem(
    await parseAppsScriptResponse<Partial<InventoryItem>>(response, "Failed to create inventory item"),
  );
}

export async function updateInventoryViaAppsScript(id: string, data: InventoryWriteInput): Promise<InventoryItem> {
const response = await fetch(inventoryAppsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "update", id, data }),
  });

  return normalizeInventoryItem(
    await parseAppsScriptResponse<Partial<InventoryItem>>(response, "Failed to update inventory item"),
  );
}

export async function deleteInventoryViaAppsScript(id: string): Promise<void> {
  const response = await fetch(inventoryAppsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "delete", id }),
  });

  await parseAppsScriptResponse(response, "Failed to delete inventory item");
}
