import { SiteHeader } from "@/components/layout/site-header";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { HomePageHeading } from "@/components/home/home-page-heading";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-6 pb-28">
        <HomePageHeading />
        <HomeDashboard />
      </main>
    </>
  );
}
