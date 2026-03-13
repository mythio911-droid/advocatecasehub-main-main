interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  description?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, trend, trendType = "positive", description, icon }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <p className="table-header">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {trend && (
        <p className={`text-xs font-medium mt-1 ${
          trendType === "positive" ? "text-success" : 
          trendType === "negative" ? "text-destructive" : "text-muted-foreground"
        }`}>
          {trend}
        </p>
      )}
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}
