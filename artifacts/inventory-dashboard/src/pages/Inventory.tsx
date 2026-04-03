import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListInventory,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import type { InventoryItem, CreateInventoryItemBody } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

const CATEGORIES = ["Electronics", "Furniture", "Stationery", "Clothing", "Food", "Other"];

function InventoryForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: {
  initialData?: Partial<CreateInventoryItemBody>;
  onSubmit: (data: CreateInventoryItemBody) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreateInventoryItemBody>({
    name: initialData?.name ?? "",
    sku: initialData?.sku ?? "",
    category: initialData?.category ?? "Electronics",
    quantity: initialData?.quantity ?? 0,
    unitPrice: initialData?.unitPrice ?? 0,
    costPrice: initialData?.costPrice ?? 0,
    reorderLevel: initialData?.reorderLevel ?? 10,
    location: initialData?.location ?? "",
  });

  const handleChange = (field: keyof CreateInventoryItemBody, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1.5">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Product name" />
      </div>
      <div className="space-y-1.5">
        <Label>SKU</Label>
        <Input value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} placeholder="SKU-XXX-001" />
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <select
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Quantity</Label>
        <Input type="number" value={form.quantity} onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)} />
      </div>
      <div className="space-y-1.5">
        <Label>Reorder Level</Label>
        <Input type="number" value={form.reorderLevel} onChange={(e) => handleChange("reorderLevel", parseInt(e.target.value) || 0)} />
      </div>
      <div className="space-y-1.5">
        <Label>Unit Price ($)</Label>
        <Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => handleChange("unitPrice", parseFloat(e.target.value) || 0)} />
      </div>
      <div className="space-y-1.5">
        <Label>Cost Price ($)</Label>
        <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => handleChange("costPrice", parseFloat(e.target.value) || 0)} />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label>Location</Label>
        <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Warehouse A" />
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: items = [] } = useListInventory({ search: search || undefined, category: categoryFilter || undefined });
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  const handleCreate = (data: CreateInventoryItemBody) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        setShowAdd(false);
      },
    });
  };

  const handleUpdate = (data: CreateInventoryItemBody) => {
    if (!editItem) return;
    updateMutation.mutate({ id: editItem.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        setEditItem(null);
      },
    });
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteMutation.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        setDeleteId(null);
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} items in stock</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Unit Price</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Cost Price</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    <Package className="mx-auto h-10 w-10 opacity-30 mb-3" />
                    <p className="font-medium">No inventory items found</p>
                    <p className="text-xs mt-1 opacity-70">Add your first item to get started</p>
                  </td>
                </tr>
              ) : items.map((item) => (
                <tr key={item.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${item.quantity <= item.reorderLevel ? "text-red-600" : ""}`}>
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(item.costPrice)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.location}</td>
                  <td className="px-4 py-3">
                    {item.quantity <= item.reorderLevel ? (
                      <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                    ) : (
                      <Badge className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100">In Stock</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
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

      {/* Add Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <InventoryForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <InventoryForm
              initialData={editItem}
              onSubmit={handleUpdate}
              onCancel={() => setEditItem(null)}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
