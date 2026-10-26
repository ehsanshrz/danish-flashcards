import { Plus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { DECK_CATEGORIES, WORD_TYPES, type DeckCategory, type Flashcard, type WordType } from '../types'
import { FIELD_MAX_LENGTH, validateCardForm, type CardFormErrors, type CardFormValues } from '../utils/validation'
import { Modal } from './Modal'

interface AddCardModalProps {
  existingCards: Flashcard[]
  defaultCategory?: DeckCategory
  onAdd: (values: CardFormValues) => void
  onClose: () => void
}

const inputClass =
  'w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:outline-none'

function fieldClass(error?: string) {
  return `${inputClass} ${
    error ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500/30'
  }`
}

interface FieldProps {
  id: string
  label: string
  error?: string
  optional?: boolean
  children: ReactNode
}

function Field({ id, label, error, optional, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-200">
        {label} {optional && <span className="font-normal text-slate-500">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}

export function AddCardModal({ existingCards, defaultCategory = 'Daily Life', onAdd, onClose }: AddCardModalProps) {
  const [values, setValues] = useState<CardFormValues>({
    danish: '',
    gender: 'en',
    phonetic: '',
    category: defaultCategory,
    english: '',
    persian: '',
    example: '',
  })
  const [errors, setErrors] = useState<CardFormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const update = <K extends keyof CardFormValues>(key: K, value: CardFormValues[K]) => {
    const next = { ...values, [key]: value }
    setValues(next)
    if (submitted) setErrors(validateCardForm(next, existingCards))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    const found = validateCardForm(values, existingCards)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onAdd(values)
    onClose()
  }

  const a11y = (key: keyof CardFormValues) => ({
    id: `card-${key}`,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `card-${key}-error` : undefined,
  })

  return (
    <Modal title="Add a new card" icon={<Plus className="size-5 text-sky-400" />} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field id="card-danish" label="Danish word or phrase" error={errors.danish}>
          <input
            {...a11y('danish')}
            lang="da"
            maxLength={FIELD_MAX_LENGTH.danish}
            value={values.danish}
            onChange={(event) => update('danish', event.target.value)}
            placeholder="e.g. en hund"
            className={fieldClass(errors.danish)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="card-gender" label="Gender / type" error={errors.gender}>
            <select
              {...a11y('gender')}
              value={values.gender}
              onChange={(event) => update('gender', event.target.value as WordType)}
              className={fieldClass(errors.gender)}
            >
              {WORD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field id="card-category" label="Category" error={errors.category}>
            <select
              {...a11y('category')}
              value={values.category}
              onChange={(event) => update('category', event.target.value as DeckCategory)}
              className={fieldClass(errors.category)}
            >
              {DECK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="card-phonetic" label="Phonetic guide" error={errors.phonetic} optional>
          <input
            {...a11y('phonetic')}
            maxLength={FIELD_MAX_LENGTH.phonetic}
            value={values.phonetic}
            onChange={(event) => update('phonetic', event.target.value)}
            placeholder="e.g. hoon"
            className={fieldClass(errors.phonetic)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="card-english" label="English" error={errors.english}>
            <input
              {...a11y('english')}
              maxLength={FIELD_MAX_LENGTH.english}
              value={values.english}
              onChange={(event) => update('english', event.target.value)}
              placeholder="e.g. a dog"
              className={fieldClass(errors.english)}
            />
          </Field>
          <Field id="card-persian" label="Persian (فارسی)" error={errors.persian}>
            <input
              {...a11y('persian')}
              dir="rtl"
              lang="fa"
              maxLength={FIELD_MAX_LENGTH.persian}
              value={values.persian}
              onChange={(event) => update('persian', event.target.value)}
              placeholder="سگ"
              className={fieldClass(errors.persian)}
            />
          </Field>
        </div>

        <Field id="card-example" label="Example sentence (Danish)" error={errors.example}>
          <textarea
            {...a11y('example')}
            lang="da"
            rows={2}
            maxLength={FIELD_MAX_LENGTH.example}
            value={values.example}
            onChange={(event) => update('example', event.target.value)}
            placeholder="e.g. Vi har en hund derhjemme."
            className={`${fieldClass(errors.example)} resize-none`}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
          >
            <Plus className="size-4" /> Add card
          </button>
        </div>
      </form>
    </Modal>
  )
}
