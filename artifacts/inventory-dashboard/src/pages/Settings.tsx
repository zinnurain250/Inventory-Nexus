import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, Shield, Database, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your application preferences</p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription className="text-xs mt-0.5">Configure alert preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {[
            { id: "low-stock", label: "Low Stock Alerts", desc: "Get notified when items fall below reorder level" },
            { id: "overdue", label: "Overdue Payments", desc: "Alerts for overdue sales and purchases" },
            { id: "new-sale", label: "New Sale Notifications", desc: "Notify on new sales created" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <Label htmlFor={item.id} className="font-medium cursor-pointer">{item.label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Switch id={item.id} defaultChecked={item.id !== "new-sale"} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Data Management</CardTitle>
              <CardDescription className="text-xs mt-0.5">Export and manage your data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export Inventory</p>
              <p className="text-xs text-muted-foreground">Download your inventory as CSV</p>
            </div>
            <Button variant="outline" size="sm">Export</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export Sales Data</p>
              <p className="text-xs text-muted-foreground">Download sales records as CSV</p>
            </div>
            <Button variant="outline" size="sm">Export</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export Purchase Data</p>
              <p className="text-xs text-muted-foreground">Download purchase records as CSV</p>
            </div>
            <Button variant="outline" size="sm">Export</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription className="text-xs mt-0.5">Access and permission settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {[
            { id: "2fa", label: "Two-Factor Authentication", desc: "Add an extra layer of security" },
            { id: "audit", label: "Audit Log", desc: "Track all changes made in the system" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <Label htmlFor={item.id} className="font-medium cursor-pointer">{item.label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Switch id={item.id} />
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
