import {Amoc} from "./amoc";

describe("getting data", () => {
  it("should download data", async () => {
    const warnings = await Amoc.get().getWarnings();

    expect(Object.keys(warnings).length).toBeGreaterThan(1);
  });

  it("should download data", async () => {
    const warnings = await Amoc.get().getWarnings();

    expect(Object.values(warnings)).toContain("IDQ11307");
  });
});
