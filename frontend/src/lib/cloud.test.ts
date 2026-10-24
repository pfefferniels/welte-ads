import { describe, expect, it } from "vitest"
import { CLOUD_TOP, CLOUD_WIDTH, artistCloud, fontSize, layoutCloud, namedAround, peakRate, rateAt, surnameOf } from "./cloud"
import { artistTimelines, bandwidth } from "./artists"
import { getAllMetadata } from "./tei"
import { names } from "../labels/names"
import { deaths } from "../labels/deaths"

describe("surnameOf", () => {
  it("keeps the particle that stands before the surname", () => {
    expect(surnameOf("Albert, Eugen d'")).toBe("d'Albert")
    expect(surnameOf("Dohnányi, Ernst von")).toBe("Dohnányi")
    expect(surnameOf("Paderewski, Ignacy Jan")).toBe("Paderewski")
  })
})

describe("layoutCloud", () => {
  const items = ["Aa", "Bbbbbb", "Cc", "Dddd"].map((label, i) => ({ id: label, label, meanYear: 1905 + 5 * i, maxRate: i, dagger: i === 3 }))

  it("places early names left of late ones, below the band at the top", () => {
    const { places } = layoutCloud(items)
    expect(places.get("Aa")!.x).toBeLessThan(places.get("Dddd")!.x)
    expect(Array.from(places.values()).every(place => place.y > CLOUD_TOP)).toBe(true)
  })

  it("gives the same names the same places", () => {
    expect(layoutCloud(items)).toEqual(layoutCloud([...items].reverse()))
  })
})

describe("the cloud of the collection", () => {
  const ads = getAllMetadata()
  const { years, artists } = artistTimelines(ads)
  const named = artists.map(artist => ({ ...artist, name: (names as Record<string, string>)[artist.id] || artist.id }))
  const h = bandwidth(ads)
  const first = years[0].year
  const last = years[years.length - 1].year
  const { names: cloud, height } = artistCloud(named, years, h, deaths)

  // the box of a name at its largest, as the layout estimates it
  const box = (name: typeof cloud[number]) => {
    const size = fontSize(Math.max(name.all, peakRate(name, h, first, last)))
    return { w: size * (0.47 * name.label.length + 0.4), h: size * 1.15 }
  }

  it("keeps every name inside the cloud", () => {
    expect(cloud.filter(name => name.x - box(name).w / 2 < 0 || name.x + box(name).w / 2 > CLOUD_WIDTH
      || name.y + box(name).h / 2 > height)).toEqual([])
  })

  it("lets no two names meet, even at their largest", () => {
    const meeting = cloud.flatMap((a, i) => cloud.slice(i + 1).filter(b =>
      Math.abs(a.x - b.x) < (box(a).w + box(b).w) / 2 && Math.abs(a.y - b.y) < (box(a).h + box(b).h) / 2)
      .map(b => `${a.label} × ${b.label}`))
    expect(meeting).toEqual([])
  })

  it("shows the most named artist for all years as large as any name at any time", () => {
    const most = cloud.reduce((a, b) => a.mentions > b.mentions ? a : b)
    expect(most.all).toBeCloseTo(Math.max(...cloud.map(name => peakRate(name, h, first, last))), 2)
  })

  it("changes the size and the shade of a name little within a month", () => {
    const paderewski = cloud.find(name => name.label === "Paderewski")!
    for (let time = first; time < last + 1; time += 1 / 12) {
      expect(Math.abs(rateAt(paderewski, h, time + 1 / 12) - rateAt(paderewski, h, time))).toBeLessThan(0.1)
      expect(Math.abs(namedAround(paderewski, time + 1 / 12) - namedAround(paderewski, time))).toBeLessThan(0.3)
    }
  })
})
