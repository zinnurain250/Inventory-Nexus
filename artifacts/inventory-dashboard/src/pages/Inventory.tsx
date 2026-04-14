import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Package, RefreshCw, TriangleAlert } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import {
  createInventoryViaAppsScript,
  deleteInventoryViaAppsScript,
  hasInventoryAppsScriptUrl,
  inventoryAppsScriptUrl,
  listInventoryFromAppsScript,
  type InventoryItem,
  type InventoryWriteInput,
  updateInventoryViaAppsScript,
} from "@/lib/apps-script-inventory";

const CATEGORIES = ["Electronics", "Furniture", "Stationery", "Clothing", "Food", "Other"];
const INVENTORY_QUERY_KEY = ["apps-script-inventory"];

function InventoryForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: {
  initialData?: Partial<InventoryWriteInput>;
  onSubmit: (data: InventoryWriteInput) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<InventoryWriteInput>({
    name: initialData?.name ?? "",
    sku: initialData?.sku ?? "",
    category: initialData?.category ?? "Electronics",
    quantity: initialData?.quantity ?? 0,
    unitPrice: initialData?.unitPrice ?? 0,
    costPrice: initialData?.costPrice ?? 0,
    reorderLevel: initialData?.reorderLevel ?? 10,
    location: initialData?.location ?? "",
  });

  const handleChange = (field: keyof InventoryWriteInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Name</Label>
        <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Product name" className="glass border-white/10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500/40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">SKU</Label>
        <Input value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} placeholder="SKU-XXX-001" className="glass border-white/10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500/40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Category</Label>
        <select
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="flex h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
        >
          {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0d1326] text-white">{c}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Quantity</Label>
        <Input type="number" value={form.quantity} onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)} className="glass border-white/10 text-white focus-visible:ring-cyan-500/40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Reorder Level</Label>
        <Input type="number" value={form.reorderLevel} onChange={(e) => handleChange("reorderLevel", parseInt(e.target.value) || 0)} className="glass border-white/10 text-white focus-visible:ring-cyan-500/40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Unit Price ($)</Label>
        <Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => handleChange("unitPrice", parseFloat(e.target.value) || 0)} className="glass border-white/10 text-white focus-visible:ring-cyan-500/40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Cost Price ($)</Label>
        <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => handleChange("costPrice", parseFloat(e.target.value) || 0)} className="glass border-white/10 text-white focus-visible:ring-cyan-500/40" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Location</Label>
        <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Warehouse A" className="glass border-white/10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500/40" />
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white">Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading} className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30">
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
export default function Inventory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();
const inventoryQuery = useQuery({
    queryKey: INVENTORY_QUERY_KEY,
    queryFn: listInventoryFromAppsScript,
    refetchInterval: 15000,
    enabled: hasInventoryAppsScriptUrl,
  });
  const allItems = inventoryQuery.data ?? [];

  const items = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const searchTerm = search.trim().toLowerCase();
      const matchesSearch = !searchTerm
        || item.name.toLowerCase().includes(searchTerm)
        || item.sku.toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });
  }, [allItems, categoryFilter, search]);

  const createMutation = useMutation({
    mutationFn: (data: InventoryWriteInput) => createInventoryViaAppsScript(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
      setShowAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InventoryWriteInput }) => updateInventoryViaAppsScript(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
      setEditItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryViaAppsScript(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
      setDeleteId(null);
    },
  });

  const handleCreate = (data: InventoryWriteInput) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: InventoryWriteInput) => {
    if (!editItem) return;
    updateMutation.mutate({ id: editItem.id, data });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
  };
return
(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory</h1>
          <p className="text-sm text-white/35 mt-1">{items.length} items in stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => inventoryQuery.refetch()}
            disabled={inventoryQuery.isFetching}
            className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-xl"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${inventoryQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAdd(true)}
            className="gap-2 bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25 hover:text-cyan-200 rounded-xl">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {!hasInventoryAppsScriptUrl && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium">Inventory is not configured yet.</p>
              <p className="mt-1 text-amber-100/80">
                Set <code className="rounded bg-black/20 px-1 py-0.5">VITE_INVENTORY_APPS_SCRIPT_URL</code> to your deployed Google Apps Script Web App URL.
              </p>
            </div>
          </div>
        </div>
      )}

      {inventoryQuery.error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <div>
              <p className="font-medium">Could not reach the inventory Apps Script.</p>
              <p className="mt-1 text-red-100/80">{inventoryQuery.error instanceof Error ? inventoryQuery.error.message : "Unknown error"}</p>
              <p className="mt-2 text-red-100/65 break-all">Current URL: {inventoryAppsScriptUrl}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            placeholder="Search inventory..."
            className="pl-9 glass border-white/10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500/40 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="" className="bg-[#0d1326]">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0d1326]">{c}</option>)}
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden glass" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Name", "SKU", "Category", "Qty", "Unit Price", "Cost Price", "Location", "Status", ""].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 ${i >= 3 && i <=
5 ? "text-right" : i === 8 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryQuery.isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-white/30">
                    <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin opacity-30" />
                    <p className="font-medium text-white/40">Loading inventory…</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-white/30">
                    <Package className="mx-auto h-10 w-10 opacity-20 mb-3" />
                    <p className="font-medium text-white/40">No inventory items found</p>
                    <p className="text-xs mt-1 text-white/25">Add your first item to get started</p>
                  </td>
                </tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-medium text-white/80">{item.name}</td>
                  <td className="px-4 py-3 text-white/35 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-white/50 text-xs border border-white/8">{item.category}</span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${item.quantity <= item.reorderLevel ? "text-red-400" : "text-white/70"}`}>
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-white/70 tabular-nums">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-white/40 tabular-nums">{formatCurrency(item.costPrice)}</td>
                  <td className="px-4 py-3 text-white/40">{item.location}</td>
                  <td className="px-4 py-3">
                    {item.quantity <= item.reorderLevel ? (
                      <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs border border-red-500/15">Low Stock</span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/15">In Stock</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg" onClick={() => setEditItem(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg glass border-white/10 text-white" style={{ background: "rgba(8,14,36,0.95)", backdropFilter: "blur(40px)" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Inventory Item</DialogTitle>
          </DialogHeader>
          <InventoryForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
<DialogContent className="max-w-lg border-white/10 text-white" style={{ background: "rgba(8,14,36,0.95)", backdropFilter: "blur(40px)" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Edit Inventory Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <InventoryForm initialData={editItem} onSubmit={handleUpdate} onCancel={() => setEditItem(null)} loading={updateMutation.isPending} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent style={{ background: "rgba(8,14,36,0.95)", backdropFilter: "blur(40px)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70 hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
