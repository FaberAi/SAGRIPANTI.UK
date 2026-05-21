import ChartPage from "@/components/ChartPage";

export default function Page({ params }: { params: Promise<{ symbol: string }> }) {
  return <ChartPage paramsPromise={params} />;
}
