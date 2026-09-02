import { Metadata } from "next";
import { Link } from "@/navigation";
import { API_URL } from "@/lib/api";
import { BookOpen, ChevronRight, Lock, Unlock } from "lucide-react";

export const metadata: Metadata = {
  title: "Academy Courses | SudokuGame24",
  description: "Browse all interactive Sudoku courses from Beginner to Expert.",
};

async function getCourses() {
  try {
    const res = await fetch(`${API_URL}/academy/courses`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-brand-navy text-white pb-24">
      <div className="bg-gradient-to-b from-[#0A2A5C] to-transparent border-b border-white/10 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-brand-gold/20 mx-auto">
            <BookOpen className="w-4 h-4" /> Interactive Academy
          </div>
          <h1 className="text-4xl md:text-6xl font-black">All Courses</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Master Sudoku with our structured, interactive learning paths.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-6">
        {courses.length === 0 ? (
          <div className="text-center p-12 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-gray-400">No courses published yet. Check back soon!</p>
          </div>
        ) : (
          courses.map((course: any) => (
            <Link key={course.id} href={`/learn/courses/${course.slug}`}>
              <div className="group bg-card border border-white/10 rounded-2xl p-6 hover:border-brand-cyan transition-colors flex flex-col md:flex-row gap-6 items-center">
                <div className="w-24 h-24 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-10 h-10 text-brand-cyan" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-black group-hover:text-brand-cyan transition-colors">
                    {course.title}
                  </h2>
                  <p className="text-gray-400 mt-2">{course.description}</p>
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full">
                      {course.level}
                    </span>
                    <span className="text-xs text-gray-500">
                      {course.modules?.length || 0} Modules
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-cyan group-hover:text-brand-navy transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
