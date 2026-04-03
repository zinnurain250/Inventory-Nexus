import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPurchases,
  useCreatePurchase,
  useUpdatePurchase,
  useDeletePurchase,
  useListSuppliers,
  useListInventory,
  getListPurchasesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetSalesTrendQueryKey,
  getGetPurchasesByLocationQueryKey,
} from "@workspace/api-client-react";
import type { Purchase, CreatePurchaseBody } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
};

function PurchaseForm({ initialData, onSubmit, onCancel, loading }: {
  initialData?: Partial<CreatePurchaseBody>;
  onSubmit: (d: CreatePurchaseBody) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { data: suppliers = [] } = useListSuppliers();
  const { data: inventory = [] } = useListInventory();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<CreatePurchaseBody>({
    supplierId: initialData?.supplierId ?? (suppliers[0]?.id ?? 0),
    inventoryItemId: initialData?.inventoryItemId ?? (inventory[0]?.id ?? 0),
    quantity: initialData?.quantity ?? 1,
    unitCost: initialData?.unitCost ?? 0,
    paymentStatus: initialData?.paymentStatus ?? "paid",
    purchaseDate: initialData?.purchaseDate ?? today,
  });

  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1.5">
        <Label>Supplier</Label>
        <select value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: parseInt(e.target.value) }))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label>Product</Label>
        <select value={form.inventoryItemId} onChange={(e) => setForm((p) => ({ ...p, inventoryItemId: parseInt(e.target.value) }))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
          {inventory.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Quantity</Label>
        <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Unit Cost ($)</Label>
        <Input type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm((p) => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Purchase Date</Label>
        <Input type="date" value={form.purchaseDate} onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Payment Status</Label>
        <select value={form.paymentStatus} onChange={(e) => setForm((p) => ({ ...p, paymentStatus: e.target.value as "paid" | "pending" | "overdue" }))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}

export default function Purchases() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Purchase | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: purchases = [] } = useListPurchases();
  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();
  const deleteMutation = useDeletePurchase();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSalesTrendQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPurchasesByLocationQueryKey() });
  };

  const filtered = purchases.filter((p) =>
    !search || p.supplierName.toLowerCase().includes(search.toLowerCase()) || p.itemName.toLowerCase().includes(search.toLowerCase())
  );

  const total = purchases.reduce((a, p) => a + p.totalCost, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
          <p className="text-sm text-muted-foreground mt-1">{purchases.length} records &mdash; Total: {formatCurrency(total)}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4" /> New Purchase</Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search purchases..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Supplier</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Unit Cost</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total Cost</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground">
                    <ShoppingBag className="mx-auto h-10 w-10 opacity-30 mb-3" />
                    <p className="font-medium">No purchases found</p>
                  </td>
                </tr>
              ) : filtered.map((purchase) => (
                <tr key={purchase.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{purchase.supplierName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{purchase.itemName}</td>
                  <td className="px-4 py-3 text-right">{purchase.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(purchase.unitCost)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(purchase.totalCost)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(purchase.purchaseDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[purchase.paymentStatus] ?? ""}`}>
                      {purchase.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(purchase)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(purchase.id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Purchase</DialogTitle></DialogHeader>
          <PurchaseForm onSubmit={(d) => createMutation.mutate({ data: d }, { onSuccess: () => { invalidate(); setShowAdd(false); } })} onCancel={() => setShowAdd(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Purchase</DialogTitle></DialogHeader>
          {editItem && <PurchaseForm initialData={editItem} onSubmit={(d) => updateMutation.mutate({ id: editItem.id, data: d }, { onSuccess: () => { invalidate(); setEditItem(null); } })} onCancel={() => setEditItem(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this purchase? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate({ id: deleteId! }, { onSuccess: () => { invalidate(); setDeleteId(null); } })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
