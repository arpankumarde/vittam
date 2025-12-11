import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[20rem] grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-3xl group/bento hover:shadow-2xl hover:shadow-primary/5 transition duration-300 shadow-sm p-6 bg-card border border-border/50 justify-between flex flex-col space-y-4 cursor-pointer overflow-hidden relative",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/bento:opacity-10 transition-opacity">
         {icon}
      </div>
      
      <div className="h-full flex flex-col">
        {header}
        <div className="mt-auto group-hover/bento:translate-x-2 transition duration-200">
          <div className="mb-2 text-primary opacity-80">
            {icon}
          </div>
          <div className="font-bold text-lg text-card-foreground mb-2">
            {title}
          </div>
          <div className="font-normal text-muted-foreground text-sm leading-relaxed">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};

