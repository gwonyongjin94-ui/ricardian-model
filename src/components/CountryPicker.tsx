import { useId, useMemo } from 'react'
import { countryFlag, countryName, useI18n } from '../i18n'
import { COUNTRY_FEATURES } from '../geo'

interface Props {
  slot: 'A' | 'B'
  value: string | null
  active: boolean
  onActivate: () => void
  onPick: (id: string) => void
}

/** Country slot card with a searchable list, for small countries that are hard to click on the map. */
export function CountryPicker({ slot, value, active, onActivate, onPick }: Props) {
  const { t, lang } = useI18n()
  const listId = useId()

  const options = useMemo(
    () =>
      COUNTRY_FEATURES.map((f) => ({ id: f.id, name: countryName(f.id, lang, f.properties.name) })).sort((a, b) =>
        a.name.localeCompare(b.name, lang),
      ),
    [lang],
  )

  const color = slot === 'A' ? 'border-a ring-a/30' : 'border-b ring-b/30'

  return (
    <div
      onClick={onActivate}
      className={
        'min-w-0 flex-1 cursor-pointer rounded-xl border-2 bg-white p-3 transition dark:bg-slate-900 ' +
        (active ? `${color} ring-4` : 'border-slate-200 dark:border-slate-800')
      }
    >
      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
        <span className={slot === 'A' ? 'text-a' : 'text-b'}>
          ● {slot}
        </span>
        {active && <span className="text-slate-400">{t.selectingSlot}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">{value ? countryFlag(value) : '🌐'}</span>
        <input
          list={listId}
          key={`${value}-${lang}`}
          defaultValue={value ? countryName(value, lang) : ''}
          placeholder={t.searchCountry}
          onFocus={(e) => {
            onActivate()
            e.currentTarget.select()
          }}
          onChange={(e) => {
            const match = options.find((o) => o.name === e.target.value)
            if (match) onPick(match.id)
          }}
          className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-slate-400"
        />
        <datalist id={listId}>
          {options.map((o) => (
            <option key={o.id} value={o.name} />
          ))}
        </datalist>
      </div>
    </div>
  )
}
