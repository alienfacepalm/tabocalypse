import { describe, expect, it } from "vitest";
import { newsPerspectiveAssignmentReason } from "./news-perspective-assignment";

describe("newsPerspectiveAssignmentReason", () => {
  it("explains left-center mapping into the Left column", () => {
    expect(
      newsPerspectiveAssignmentReason({
        perspective: "left",
        role: "article",
        bias: "left-center",
        source: "Example News",
        isOpinion: true,
      }),
    ).toBe(
      "Example News is rated Left-center on FreeQuickNews's publisher bias index. Left-center ratings are grouped into the Left column. Assigned to this perspective because the headline was detected as opinion or editorial.",
    );
  });

  it("explains reporting-only lean labels", () => {
    expect(
      newsPerspectiveAssignmentReason({
        perspective: "center",
        role: "article",
        bias: "center",
        source: "Wire Service",
        isOpinion: false,
      }),
    ).toContain("treated as reporting, not opinion");
  });

  it("explains missing topic slots", () => {
    expect(
      newsPerspectiveAssignmentReason({
        perspective: "right",
        role: "topic-slot-missing",
      }),
    ).toContain("right or right-center");
  });

  it("explains column headers", () => {
    expect(
      newsPerspectiveAssignmentReason({
        perspective: "left",
        role: "column-header",
      }),
    ).toContain("Left or Left-center on FreeQuickNews");
  });

  it("handles unknown publisher ratings", () => {
    expect(
      newsPerspectiveAssignmentReason({
        perspective: "center",
        role: "article",
        bias: "unknown",
        source: "Mystery Blog",
      }),
    ).toBe("No FreeQuickNews publisher rating — Left, Center, and Right labels are not shown");
  });
});
