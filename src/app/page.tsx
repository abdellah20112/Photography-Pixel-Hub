import { BRANDING } from "@/config/branding";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {BRANDING.companyName}
      </h1>
      <p className="max-w-md text-muted-foreground sm:text-lg">
        {BRANDING.metadata.description}
      </p>
    </main>
  );
}
