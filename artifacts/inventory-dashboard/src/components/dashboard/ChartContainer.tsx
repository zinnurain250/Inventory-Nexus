import { ReactNode } from "react";
import { BarChart2 } from "lucide-react";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  isEmpty?: boolean;
}

export function ChartContainer({ title, description, children, isEmpty = false }: ChartContainerProps) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden glass"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white/85 tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-white/35 mt-0.5">{description}</p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-6">
        {isEmpty ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-white/30 rounded-xl border border-dashed border-white/8">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/8">
              <BarChart2 className="h-5 w-5 opacity-40" />
            </div>
            <p className="font-medium text-sm text-white/40">No data yet</p>
            <p className="text-xs text-white/25 mt-1">Check back when data is available.</p>
          </div>
        ) : (
          <div className="h-full min-h-[300px] w-full">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
