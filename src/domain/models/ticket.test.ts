import { describe, it, expect } from "@jest/globals";
import { validateSearchParams, searchParamsSchema } from "./ticket.js";

describe("searchParamsSchema", () => {
  it("should accept valid params with all fields", () => {
    const data = {
      project: "PLAT",
      issueType: "Bug",
      status: "Open",
      component: "Ingestion",
      textSearch: "error",
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it("should accept params with null values", () => {
    const data = {
      project: null,
      issueType: null,
      status: null,
      component: null,
      textSearch: null,
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should accept mixed null and string values", () => {
    const data = {
      project: "PLAT",
      issueType: null,
      status: "Open",
      component: null,
      textSearch: null,
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("PLAT");
      expect(result.data.issueType).toBeNull();
    }
  });

  it("should reject missing required fields", () => {
    const data = {
      project: "PLAT",
      // missing other fields
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should reject invalid types", () => {
    const data = {
      project: 123, // should be string or null
      issueType: null,
      status: null,
      component: null,
      textSearch: null,
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe("validateSearchParams", () => {
  it("should return valid params", () => {
    const data = {
      project: "PLAT",
      issueType: "Bug",
      status: null,
      component: null,
      textSearch: null,
    };

    const result = validateSearchParams(data);

    expect(result.project).toBe("PLAT");
    expect(result.issueType).toBe("Bug");
  });

  it("should throw error for invalid data", () => {
    const data = {
      project: "PLAT",
      // missing fields
    };

    expect(() => validateSearchParams(data)).toThrow("Respuesta del LLM no válida");
  });

  it("should throw error with field details", () => {
    const data = {
      project: 123,
      issueType: null,
      status: null,
      component: null,
      textSearch: null,
    };

    expect(() => validateSearchParams(data)).toThrow("project");
  });

  it("should handle undefined as invalid", () => {
    const data = {
      project: undefined,
      issueType: null,
      status: null,
      component: null,
      textSearch: null,
    };

    expect(() => validateSearchParams(data)).toThrow();
  });
});

describe("nullableString transformation", () => {
  it('should transform string "null" to actual null', () => {
    const data = {
      project: "TRD",
      issueType: "null",
      status: "null",
      component: "null",
      textSearch: "null",
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("TRD");
      expect(result.data.issueType).toBeNull();
      expect(result.data.status).toBeNull();
      expect(result.data.component).toBeNull();
      expect(result.data.textSearch).toBeNull();
    }
  });

  it("should transform empty strings to null", () => {
    const data = {
      project: "TRD",
      issueType: "",
      status: "",
      component: "",
      textSearch: "",
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("TRD");
      expect(result.data.issueType).toBeNull();
      expect(result.data.status).toBeNull();
      expect(result.data.component).toBeNull();
      expect(result.data.textSearch).toBeNull();
    }
  });

  it("should preserve actual null values", () => {
    const data = {
      project: "TRD",
      issueType: null,
      status: null,
      component: null,
      textSearch: null,
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("TRD");
      expect(result.data.issueType).toBeNull();
      expect(result.data.status).toBeNull();
      expect(result.data.component).toBeNull();
      expect(result.data.textSearch).toBeNull();
    }
  });

  it("should preserve valid string values", () => {
    const data = {
      project: "TRD",
      issueType: "Epic",
      status: "En Progreso",
      component: "Plataforma del Dato",
      textSearch: "error login",
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("TRD");
      expect(result.data.issueType).toBe("Epic");
      expect(result.data.status).toBe("En Progreso");
      expect(result.data.component).toBe("Plataforma del Dato");
      expect(result.data.textSearch).toBe("error login");
    }
  });

  it('should handle mixed "null" strings and valid values', () => {
    const data = {
      project: "TRD",
      issueType: "null",
      status: "Nueva",
      component: "",
      textSearch: null,
    };

    const result = searchParamsSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe("TRD");
      expect(result.data.issueType).toBeNull();
      expect(result.data.status).toBe("Nueva");
      expect(result.data.component).toBeNull();
      expect(result.data.textSearch).toBeNull();
    }
  });
});

