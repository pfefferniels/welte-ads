import { describe, expect, it } from "vitest"
import { dateList, formatDate, formatDates } from "./dates"

describe("formatDate", () => {
  it("gives a date as precisely as it is known", () => {
    expect(formatDate("1913-11-05")).toBe("5 November 1913")
    expect(formatDate("1913-11")).toBe("November 1913")
    expect(formatDate("1913")).toBe("1913")
  })
})

describe("dateList", () => {
  it("gives each run of days in a row as one range", () => {
    expect(dateList(["1908-01-28", "1908-01-29", "1908-02-01", "1908-01-30", "1908-01-31", "1908-02-15", "1908-02-16"]))
      .toEqual(["28 January – 1 February", "15–16 February 1908"])
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
      .toBe("2–3, 5 February 1908")
  })

  it("writes a month or year once for the days and months that share it", () => {
    expect(formatDates(["1919-11-09", "1919-11-13", "1919-12-04", "1920-01-01", "1920-01-04"]))
      .toBe("9, 13 November, 4 December 1919, 1, 4 January 1920")
    expect(formatDates(["1908-01-28", "1908-01-29", "1908-01-30", "1908-02-15", "1908-02-16"]))
      .toBe("28–30 January, 15–16 February 1908")
    expect(formatDates(["1926-04", "1926-07", "1927-01"])).toBe("April, July 1926, January 1927")
  })

  it("keeps a month or a year alone", () => {
    expect(formatDates(["1911-10", "1911-10-01", "1911"])).toBe("1911, October 1911, 1 October 1911")
  })
})
