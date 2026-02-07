import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            Prep Wisely
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A focused UPSC preparation system with planning, practice, and AI support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link href="/auth/sign-in">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What This App Does */}
      <section className="px-4 py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-semibold mb-8 text-center">What This App Does</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Daily Microplans</h3>
              <p className="text-muted-foreground">
                Create focused daily study plans with task checklists. Track completion and carry forward unfinished tasks.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">MCQ Practice & Weak Areas</h3>
              <p className="text-muted-foreground">
                Practice MCQs with immediate feedback. Automatically identify and track weak areas based on your performance.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">AI-Assisted Planning</h3>
              <p className="text-muted-foreground">
                Get context-aware plan suggestions based on your weak areas and progress. You remain in control—AI suggests, you decide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Helps UPSC Aspirants */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-semibold mb-8 text-center">How It Helps UPSC Aspirants</h2>
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Build Discipline</h3>
              <p className="text-muted-foreground">
                Consistent daily planning creates structure. Track your progress week over week to maintain momentum.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Feedback Loop</h3>
              <p className="text-muted-foreground">
                See what you're missing through MCQ performance. Weak area tracking shows exactly where to focus your revision efforts.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Reduce Overwhelm</h3>
              <p className="text-muted-foreground">
                Break down preparation into manageable daily tasks. AI suggestions help prioritize based on your actual performance data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Credibility */}
      <section className="px-4 py-12 md:py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm text-muted-foreground">
            Built with Next.js, Prisma, and AI integration. Type-safe, validated, and designed for reliability.
          </p>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Begin planning your UPSC preparation today. Sign up to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link href="/auth/sign-in">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
