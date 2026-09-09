import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-muted-foreground",
        critical:
          "border-status-critical/40 bg-status-critical/10 text-status-critical",
        warning:
          "border-status-warning/40 bg-status-warning/10 text-status-warning",
        healthy:
          "border-status-healthy/40 bg-status-healthy/10 text-status-healthy",
        info: "border-status-info/40 bg-status-info/10 text-status-info",
        ai: "border-ai/40 bg-ai/10 text-ai",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
