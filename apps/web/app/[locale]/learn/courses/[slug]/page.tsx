import { notFound } from "next/navigation";
import { Link } from "@/navigation";
import { API_URL } from "@/lib/api";
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, PlayCircle } from "lucide-react";

async function getCourse(slug: string) {
  try {
    const res = await fetch(`${API_URL}/academy/courses/${slug}`, {
      next: { revalidate: 60 }, // short cache for progress updates
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const course = await getCourse(slug);

  if (!course) notFound();

  return (
    <div className="min-h-screen bg-brand-navy text-white pb-24">
      <div className="bg-gradient-to-b from-[#0A2A5C] to-transparent border-b border-white/10 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href="/learn/courses"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Courses
          </Link>
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold uppercase tracking-wider text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/30">
               {course.level}
             </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black">{course.title}</h1>
          <p className="text-lg text-gray-300 max-w-3xl">{course.description}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-12">
        {course.modules?.map((module: any, idx: number) => (
          <div key={module.id} className="space-y-4">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-black">
                {idx + 1}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{module.title}</h2>
                {module.description && <p className="text-sm text-gray-400">{module.description}</p>}
              </div>
            </div>

            <div className="space-y-3">
              {module.lessons?.map((lesson: any, lIdx: number) => (
                <Link
                  key={lesson.id}
                  href={`/learn/courses/${course.slug}/lessons/${lesson.slug}`}
                >
                  <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-cyan/50 rounded-xl transition-all group">
                    <div className="flex items-center gap-4">
                      <PlayCircle className="w-5 h-5 text-gray-400 group-hover:text-brand-cyan transition-colors" />
                      <span className="font-medium text-gray-200 group-hover:text-white">
                        {lIdx + 1}. {lesson.title}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-cyan" />
                  </div>
                </Link>
              ))}
              {(!module.lessons || module.lessons.length === 0) && (
                 <p className="text-sm text-gray-500 pl-14">No lessons in this module yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
