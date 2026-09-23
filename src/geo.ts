import { geoArea, geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'

export const WIDTH = 960
export const HEIGHT = 500

export type CountryFeature = Feature<Geometry, { name: string }>

const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
const collection = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>

/** Features with a stable id: the ISO numeric code, or the atlas name for the few disputed areas without one. */
export const COUNTRY_FEATURES: (CountryFeature & { id: string })[] = collection.features
  .filter((f) => f.properties.name !== 'Antarctica')
  .map((f) => ({ ...f, id: String(f.id ?? f.properties.name) }))

const projection = geoNaturalEarth1().fitExtent(
  [
    [4, 4],
    [WIDTH - 4, HEIGHT - 4],
  ],
  { type: 'FeatureCollection', features: COUNTRY_FEATURES } as FeatureCollection,
)
export const path = geoPath(projection)

/** Anchor point for arrows: the centroid of the country's largest polygon, so overseas territories don't pull it away. */
export function anchor(f: CountryFeature): [number, number] {
  return projection(geoCentroid(mainPolygon(f))) ?? [WIDTH / 2, HEIGHT / 2]
}

export type ViewBox = [number, number, number, number]

export const FULL_VIEW: ViewBox = [0, 0, WIDTH, HEIGHT]

function mainPolygon(f: CountryFeature): Geometry {
  if (f.geometry.type !== 'MultiPolygon') return f.geometry
  const polys = (f.geometry as MultiPolygon).coordinates.map((c): Polygon => ({ type: 'Polygon', coordinates: c }))
  return polys.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a))
}

/** A view box framing both countries with some room around them, keeping the map's aspect ratio. */
export function fitView(features: CountryFeature[]): ViewBox {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const f of features) {
    const [[a, b], [c, d]] = path.bounds(mainPolygon(f))
    x0 = Math.min(x0, a)
    y0 = Math.min(y0, b)
    x1 = Math.max(x1, c)
    y1 = Math.max(y1, d)
  }
  const aspect = WIDTH / HEIGHT
  let w = Math.max((x1 - x0) * 1.6, 220)
  let h = Math.max((y1 - y0) * 1.6, 220 / aspect)
  if (w / h > aspect) h = w / aspect
  else w = h * aspect
  if (w >= WIDTH) return FULL_VIEW
  const cx = Math.min(Math.max((x0 + x1) / 2, w / 2), WIDTH - w / 2)
  const cy = Math.min(Math.max((y0 + y1) / 2, h / 2), HEIGHT - h / 2)
  return [cx - w / 2, cy - h / 2, w, h]
}
