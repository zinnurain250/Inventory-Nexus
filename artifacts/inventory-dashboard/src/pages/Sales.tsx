import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, ShoppingCart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSales,
  useCreateSale,
  useUpdateSale,
  useDeleteSale,
  useListCustomers,
  useListInventory,
  getListSalesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetSalesTrendQueryKey,
  getGetTopCustomersQueryKey,
  getGetSalesByCategoryQueryKey,
} from "@workspace/api-client-react";
import type { Sale, CreateSaleBody } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
};

function SaleForm({ initialData, onSubmit, onCancel, loading }: {
  initialData?: Partial<CreateSaleBody>;
  onSubmit: (d: CreateSaleBody) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { data: customers = [] } = useListCustomers();
  const { data: inventory = [] } = useListInventory();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<CreateSaleBody>({
    customerId: initialData?.customerId ?? (customers[0]?.id ?? 0),
    inventoryItemId: initialData?.inventoryItemId ?? (inventory[0]?.id ?? 0),
    quantity: initialData?.quantity ?? 1,
    unitPrice: initialData?.unitPrice ?? 0,
    paymentStatus: initialData?.paymentStatus ?? "paid",
    saleDate: initialData?.saleDate ?? today,
  });

  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1.5">
        <Label>Customer</Label>
        <select value={form.customerId} onChange={(e) => setForm((p) => ({ ...p, customerId: parseInt(e.target.value) }))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
        <Label>Unit Price ($)</Label>
        <Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm((p) => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Sale Date</Label>
        <Input type="date" value={form.saleDate} onChange={(e) => setForm((p) => ({ ...p, saleDate: e.target.value }))} />
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

export default function Sales() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Sale | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: sales = [] } = useListSales();
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();
  const deleteMutation = useDeleteSale();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSalesTrendQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTopCustomersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSalesByCategoryQueryKey() });
  };

  const filtered = sales.filter((s) =>
    !search || s.customerName.toLowerCase().includes(search.toLowerCase()) || s.itemName.toLowerCase().includes(search.toLowerCase())
  );

  const totalSales = sales.reduce((a, s) => a + s.totalAmount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">{sales.length} records &mdash; Total: {formatCurrency(totalSales)}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4" /> New Sale</Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search sales..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Unit Price</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto h-10 w-10 opacity-30 mb-3" />
                    <p className="font-medium">No sales found</p>
                  </td>
                </tr>
              ) : filtered.map((sale) => (
                <tr key={sale.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{sale.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sale.itemName}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{sale.category}</Badge></td>
                  <td className="px-4 py-3 text-right">{sale.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(sale.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(sale.totalAmount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(sale.saleDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[sale.paymentStatus] ?? ""}`}>
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem(sale)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(sale.id)}>
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
          <DialogHeader><DialogTitle>New Sale</DialogTitle></DialogHeader>
          <SaleForm onSubmit={(d) => createMutation.mutate({ data: d }, { onSuccess: () => { invalidate(); setShowAdd(false); } })} onCancel={() => setShowAdd(false)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Sale</DialogTitle></DialogHeader>
          {editItem && <SaleForm initialData={editItem} onSubmit={(d) => updateMutation.mutate({ id: editItem.id, data: d }, { onSuccess: () => { invalidate(); setEditItem(null); } })} onCancel={() => setEditItem(null)} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this sale record? This action cannot be undone.</AlertDialogDescription>
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
