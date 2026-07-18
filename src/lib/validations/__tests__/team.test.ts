import { describe, it, expect } from "vitest";

import {
  createTeamMemberSchema,
  updateTeamMemberSchema,
  assignMemberSchema,
  updateAssignmentSchema,
  teamQuerySchema,
  teamRoleSchema,
  teamMemberStatusSchema,
  teamFilterSchema,
  roleFilterSchema,
  teamSortSchema,
} from "@/lib/validations/team";

const validMember = {
  fullName: "أحمد المصور",
  email: "ahmed@studio.com",
  phone: "0501234567",
  role: "PHOTOGRAPHER" as const,
  status: "ACTIVE" as const,
  joinDate: new Date("2025-01-01").toISOString(),
};

describe("createTeamMemberSchema", () => {
  it("accepts valid input", () => {
    expect(createTeamMemberSchema.safeParse(validMember).success).toBe(true);
  });

  it("rejects short name", () => {
    expect(createTeamMemberSchema.safeParse({ ...validMember, fullName: "أ" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(createTeamMemberSchema.safeParse({ ...validMember, email: "not-email" }).success).toBe(false);
  });

  it("rejects missing phone", () => {
    expect(createTeamMemberSchema.safeParse({ ...validMember, phone: "" }).success).toBe(false);
  });
});

describe("updateTeamMemberSchema", () => {
  it("accepts valid update", () => {
    expect(updateTeamMemberSchema.safeParse(validMember).success).toBe(true);
  });
});

describe("assignMemberSchema", () => {
  it("accepts valid assignment", () => {
    expect(assignMemberSchema.safeParse({
      projectId: "p1", teamMemberId: "m1", role: "EDITOR",
    }).success).toBe(true);
  });

  it("rejects missing projectId", () => {
    expect(assignMemberSchema.safeParse({ teamMemberId: "m1", role: "EDITOR" }).success).toBe(false);
  });
});

describe("updateAssignmentSchema", () => {
  it("accepts valid update", () => {
    expect(updateAssignmentSchema.safeParse({ role: "PHOTOGRAPHER" }).success).toBe(true);
  });

  it("accepts completed flag", () => {
    expect(updateAssignmentSchema.safeParse({ role: "EDITOR", completed: true }).success).toBe(true);
  });
});

describe("teamRoleSchema", () => {
  it("accepts all roles", () => {
    ["OWNER", "ADMIN", "PROJECT_MANAGER", "PHOTOGRAPHER", "VIDEOGRAPHER", "EDITOR", "DESIGNER", "MEDIA_BUYER", "ACCOUNTANT"].forEach(r => {
      expect(teamRoleSchema.safeParse(r).success).toBe(true);
    });
  });

  it("rejects unknown role", () => {
    expect(teamRoleSchema.safeParse("INTERN").success).toBe(false);
  });
});

describe("teamMemberStatusSchema", () => {
  it("accepts all statuses", () => {
    ["ACTIVE", "INACTIVE", "ON_LEAVE"].forEach(s => {
      expect(teamMemberStatusSchema.safeParse(s).success).toBe(true);
    });
  });
});

describe("teamFilterSchema", () => {
  it("accepts all filters", () => {
    ["all", "active", "inactive", "on_leave"].forEach(f => {
      expect(teamFilterSchema.safeParse(f).success).toBe(true);
    });
  });
});

describe("teamSortSchema", () => {
  it("accepts all sorts", () => {
    ["newest", "oldest", "alphabetical"].forEach(s => {
      expect(teamSortSchema.safeParse(s).success).toBe(true);
    });
  });
});

describe("teamQuerySchema", () => {
  it("uses defaults", () => {
    const result = teamQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(10);
    }
  });
});
