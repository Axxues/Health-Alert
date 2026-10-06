import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { MetricCard } from "./MetricCard";
import { PageHeader } from "./PageHeader";
import { Skeleton, PageSkeleton, TableRowSkeleton } from "./Skeleton";

describe("UI Primitives", () => {
  it("renders Button with primary variant and content", () => {
    const html = renderToStaticMarkup(<Button variant="primary">Deploy SOP</Button>);
    expect(html).toContain("Deploy SOP");
    expect(html).toContain("bg-primary");
  });

  it("renders Badge with pulse animation on critical danger", () => {
    const html = renderToStaticMarkup(<Badge variant="danger" pulse>Outbreak Surge</Badge>);
    expect(html).toContain("Outbreak Surge");
    expect(html).toContain("animate-ping");
  });

  it("renders MetricCard with title, value, and tabular numbers", () => {
    const html = renderToStaticMarkup(
      <MetricCard
        title="Active Hotspots"
        value={14}
        subtitle="3 requiring immediate field visit"
      />
    );
    expect(html).toContain("Active Hotspots");
    expect(html).toContain("14");
    expect(html).toContain("tabular-nums");
  });

  it("renders PageHeader with title and breadcrumb trail", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        title="Surveillance Console"
        description="Real-time sentinel telemetry"
      />
    );
    expect(html).toContain("Surveillance Console");
    expect(html).toContain("Real-time sentinel telemetry");
  });

  it("renders Skeleton, PageSkeleton, and TableRowSkeleton correctly", () => {
    const skeletonHtml = renderToStaticMarkup(<Skeleton className="h-6 w-24" />);
    expect(skeletonHtml).toContain("animate-pulse");

    const pageSkeletonHtml = renderToStaticMarkup(<PageSkeleton />);
    expect(pageSkeletonHtml).toContain("animate-pulse");

    const tableSkeletonHtml = renderToStaticMarkup(
      <table>
        <tbody>
          <TableRowSkeleton columns={5} rows={3} />
        </tbody>
      </table>
    );
    expect(tableSkeletonHtml).toContain("<tr");
    expect(tableSkeletonHtml).toContain("<td");
  });
});

