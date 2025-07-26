export interface StepField {
  name: string
  type: string
  label: string
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string | number }[] // si select/radio
}

export interface StepAssets {
  type: 'form' // ou autre dans le futur
  fields: StepField[]
  validation: Record<string, string[]> // ex: { first_name: ["required", "min:2"] }
}

export interface StepConfig {
  total_steps: number
  current_step: number
  title: string
  slug: string
  assets: StepAssets
  data: Record<string, any>
  error?: string
}

export interface RegistrationSummaryStep {
  slug: string
  label: string
  has_error: boolean
  data: string | null
  error?: string
  file_info?: {
    name: string
    size: number
    type: string
    preview: string | null
  } | null
}

export interface RegistrationSummary {
  title: string
  is_valid: boolean
  steps: RegistrationSummaryStep[]
}
