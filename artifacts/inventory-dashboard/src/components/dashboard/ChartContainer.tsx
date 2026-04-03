import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  isEmpty?: boolean;
}

export function ChartContainer({ title, description, children, isEmpty = false }: ChartContainerProps) {
  return (
    <Card className="flex flex-col border-card-border shadow-sm">
      <CardHeader className="items-center pb-0 border-b border-border/40 px-6 py-4 bg-muted/20">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 p-6">
        {isEmpty ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-md border border-dashed">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
            </div>
            <p className="font-medium text-sm">No data yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Check back later when data is available.</p>
          </div>
        ) : (
          <div className="h-full min-h-[300px] w-full">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
