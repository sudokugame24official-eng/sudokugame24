import { notFound } from "next/navigation";
import { Link } from "@/navigation";
import { API_URL } from "@/lib/api";
import { ArrowLeft, CheckCircle2, Play } from "lucide-react";
// Interactive Sudoku Board would be imported here in a real integration

async function getLesson(slug: string) {
  try {
    const res = await fetch(`${API_URL}/academy/lessons/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; lessonSlug: string }>;
}) {
  const { locale, slug, lessonSlug } = await params;
  const lesson = await getLesson(lessonSlug);

  if (!lesson) notFound();

  return (
    <div className="min-h-screen bg-brand-navy text-white pb-32">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-brand-navy/90 backdrop-blur-md border-b border-white/10 py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={`/learn/courses/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {lesson.module?.course?.title || "Back to Course"}
          </Link>
          <div className="text-sm text-gray-500 font-medium">
             Module: {lesson.module?.title}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-10">
        <h1 className="text-4xl md:text-5xl font-black leading-tight">
          {lesson.title}
        </h1>

        <div 
          className="prose prose-invert max-w-none prose-headings:font-black prose-p:text-gray-300 prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />

        {lesson.interactive && (
           <div className="mt-12 p-8 bg-[#0c1b33] border border-brand-cyan/30 rounded-3xl text-center space-y-6">
              <h3 className="text-2xl font-bold text-brand-cyan">Interactive Practice</h3>
              <p className="text-gray-400">Apply what you've learned on a live board.</p>
              {/* Interactive Board Component placeholder */}
              <div className="w-full max-w-md mx-auto aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                 <span className="text-sm font-mono text-gray-500">Board Data: {JSON.stringify(lesson.interactive).slice(0,20)}...</span>
              </div>
           </div>
        )}

        <div className="mt-16 pt-8 border-t border-white/10 flex justify-between items-center">
           {/* In a real implementation, this would trigger the /complete endpoint via a client component */}
           <button className="px-8 py-4 bg-brand-cyan text-brand-navy font-black rounded-xl uppercase tracking-wider flex items-center gap-2 hover:brightness-110">
             <CheckCircle2 className="w-5 h-5" /> Mark as Complete
           </button>
           
           <Link href={`/learn/courses/${slug}`}>
             <button className="px-6 py-4 bg-white/5 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-white/10">
                Next Lesson <Play className="w-4 h-4" />
             </button>
           </Link>
        </div>
      </div>
    </div>
  );
}
