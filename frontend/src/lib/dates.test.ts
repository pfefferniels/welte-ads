import { describe, expect, it } from "vitest"
import { formatDate, formatDates } from "./dates"

describe("formatDate", () => {
  it("gives a date as precisely as it is known", () => {
    expect(formatDate("1913-11-05")).toBe("5 November 1913")
    expect(formatDate("1913-11")).toBe("November 1913")
    expect(formatDate("1913")).toBe("1913")
  })
})

describe("formatDates", () => {
  it("makes days in a row one range", () => {
    expect(formatDates(["1908-02-03", "1908-02-02", "1908-02-04"])).toBe("2–4 February 1908")
    expect(formatDates(["1908-01-31", "1908-02-01"])).toBe("31 January – 1 February 1908")
    expect(formatDates(["1919-12-31", "1920-01-01"])).toBe("31 December 1919 – 1 January 1920")
  })

  it("lists days that are not in a row", () => {
    expect(formatDates(["1908-02-02", "1908-02-03", "1908-02-05", "1908-02-05"]))
      .toBe("2–3 February 1908, 5 February 1908")
  })

  it("keeps a month or a year alone", () => {
    expect(formatDates(["1911-10", "1911-10-01", "1911"])).toBe("1911, October 1911, 1 October 1911")
  })
})
