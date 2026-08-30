import ArticlePage, { generateMetadata as generateArticleMetadata } from "../learn/[slug]/page";
import { Metadata, ResolvingMetadata } from "next";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await props.params;
  return generateArticleMetadata(
    { params: Promise.resolve({ locale, slug: "rules" }) },
    parent
  );
}

export default async function ReglesDuSudokuPage(props: Props) {
  const { locale } = await props.params;
  return ArticlePage({
    params: Promise.resolve({ locale, slug: "rules" }),
  });
}
