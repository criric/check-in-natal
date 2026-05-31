import { Field, type FieldProps } from './field'

// Re-export do Field como FormField para alinhar com a nomenclatura do spec.
// O Field existente já suporta label, hint, error, required e render prop com id/invalid.
export type FormFieldProps = FieldProps

export function FormField(props: FormFieldProps) {
  return <Field {...props} />
}
