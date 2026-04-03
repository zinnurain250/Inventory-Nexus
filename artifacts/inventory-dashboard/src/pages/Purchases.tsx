import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPurchases, useCreatePurchase, useUpdatePurchase, useDeletePurchase,
  useListSuppliers, useListInventory,
  getListPurchasesQueryKey, getGetDashboardSummaryQueryKey, getGetSalesTrendQueryKey, getGetPurchasesByLocationQueryKey,
} from "@workspace/api-client-react";
import type { Purchase, CreatePurchaseBody } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_GLASS: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15",
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/15",
  overdue: "bg-red-500/10 text-red-400 border border-red-500/15",
};

const GLASS_SELECT = "flex h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40";
const GLASS_INPUT = "glass border-white/10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500/40 rounded-xl";
const DIALOG_STYLE = { background: "rgba(8,14,36,0.95)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.1)" };
const DELETE_DIALOG_STYLE = { background: "rgba(8,14,36,0.95)", backdropFilter: "blur(40px)", border: "1px solid rgba(239,68,68,0.2)" };

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
        <Label className="text-white/60 text-xs uppercase tracking-wider">Supplier</Label>
        <select value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: parseInt(e.target.value) }))} className={GLASS_SELECT}>
          {suppliers.map((s) => <option key={s.id} value={s.id} className="bg-[#0d1326]">{s.name}</option>)}
        </select>
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Product</Label>
        <select value={form.inventoryItemId} onChange={(e) => setForm((p) => ({ ...p, inventoryItemId: parseInt(e.target.value) }))} className={GLASS_SELECT}>
          {inventory.map((i) => <option key={i.id} value={i.id} className="bg-[#0d1326]">{i.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Quantity</Label>
        <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className={GLASS_INPUT} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Unit Cost ($)</Label>
        <Input type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm((p) => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))} className={GLASS_INPUT} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Purchase Date</Label>
        <Input type="date" value={form.purchaseDate} onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))} className={GLASS_INPUT} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white/60 text-xs uppercase tracking-wider">Payment Status</Label>
        <select value={form.paymentStatus} onChange={(e) => setForm((p) => ({ ...p, paymentStatus: e.target.value as "paid" | "pending" | "overdue" }))} className={GLASS_SELECT}>
          <option value="paid" className="bg-[#0d1326]">Paid</option>
          <option value="pending" className="bg-[#0d1326]">Pending</option>
          <option value="overdue" className="bg-[#0d1326]">Overdue</option>
        </select>
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="border-white/10 text-white/70 hover:bg-white/5">Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading} className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30">{loading ? "Saving..." : "Save"}</Button>
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
    [getListPurchasesQueryKey, getGetDashboardSummaryQueryKey, getGetSalesTrendQueryKey, getGetPurchasesByLocationQueryKey]
      .forEach((fn) => queryClient.invalidateQueries({ queryKey: fn() }));
  };

  const filtered = purchases.filter((p) =>
    !search || p.supplierName.toLowerCase().includes(search.toLowerCase()) || p.itemName.toLowerCase().includes(search.toLowerCase())
  );
  const total = purchases.reduce((a, p) => a + p.totalCost, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Purchases</h1>
          <p className="text-sm text-white/35 mt-1">{purchases.length} records &mdash; Total: <span className="text-purple-400">{formatCurrency(total)}</span></p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-purple-500/15 border border-purple-500/25 text-purple-300 hover:bg-purple-500/25 rounded-xl">
          <Plus className="h-4 w-4" /> New Purchase
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
        <Input placeholder="Search purchases..." className={`pl-9 ${GLASS_INPUT}`} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-2xl overflow-hidden glass" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Supplier", "Product", "Qty", "Unit Cost", "Total Cost", "Date", "Status", ""].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 ${[2,3,4].includes(i) ? "text-right" : i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 opacity-15 mb-3 text-white" />
                  <p className="font-medium text-white/40">No purchases found</p>
                </td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-medium text-white/80">{p.supplierName}</td>
                  <td className="px-4 py-3 text-white/50">{p.itemName}</td>
                  <td className="px-4 py-3 text-right text-white/60 tabular-nums">{p.quantity}</td>
                  <td className="px-4 py-3 text-right text-white/60 tabular-nums">{formatCurrency(p.unitCost)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-purple-400 tabular-nums">{formatCurrency(p.totalCost)}</td>
                  <td className="px-4 py-3 text-white/40">{formatDate(p.purchaseDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_GLASS[p.paymentStatus] ?? ""}`}>{p.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg" onClick={() => setEditItem(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg text-white" style={DIALOG_STYLE}>
          <DialogHeader><DialogTitle className="text-white">New Purchase</DialogTitle></DialogHeader>
          <PurchaseForm onSubmit={(d) => createMutation.mutate({ data: d }, { onSuccess: () => { invalidate(); setShowAdd(false); } })} onCancel={() => setShowAdd(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg text-white" style={DIALOG_STYLE}>
          <DialogHeader><DialogTitle className="text-white">Edit Purchase</DialogTitle></DialogHeader>
          {editItem && <PurchaseForm initialData={editItem} onSubmit={(d) => updateMutation.mutate({ id: editItem.id, data: d }, { onSuccess: () => { invalidate(); setEditItem(null); } })} onCancel={() => setEditItem(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent style={DELETE_DIALOG_STYLE}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70 hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate({ id: deleteId! }, { onSuccess: () => { invalidate(); setDeleteId(null); } })} className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
