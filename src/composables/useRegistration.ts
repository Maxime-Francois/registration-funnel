import { ref } from 'vue'
import { fetchStep, postStep } from '@/api/mock'
import type { StepConfig } from '@/components/types/registration'

export function useRegistration() {
  const currentSlug = ref<string>('personal_information')
  const stepConfig = ref<StepConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadStep(slug: string) {
    loading.value = true
    error.value = null
    try {
      stepConfig.value = await fetchStep(slug)
      currentSlug.value = slug
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Une erreur est survenue'
    } finally {
      loading.value = false
    }
  }

  async function submitStep(data: Record<string, unknown>) {
    loading.value = true
    error.value = null
    try {
      const response = await postStep(currentSlug.value, data)
      stepConfig.value = response
      currentSlug.value = response.slug
      return response // retourne la réponse complète (avec next_slug)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Une erreur est survenue'
      return null
    } finally {
      loading.value = false
    }
  }

  return { currentSlug, stepConfig, loading, error, loadStep, submitStep }
}
