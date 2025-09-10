import { Suspense } from "react";
import PDFReviewDashboard from "./PDFReviewDashboard";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <PDFReviewDashboard />
    </Suspense>
  );
}
