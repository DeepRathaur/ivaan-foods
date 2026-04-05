import { AppNav } from "@/components/AppNav";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f8f4ec] dark:bg-stone-950">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-28 pt-5 md:max-w-5xl md:px-8 md:pb-10 md:pt-8">
        {children}
      </div>
      <div className="mx-auto w-full max-w-lg md:max-w-5xl">
        <AppNav />
      </div>
    </div>
  );
}
