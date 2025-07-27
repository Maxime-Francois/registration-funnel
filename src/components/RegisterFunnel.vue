<template>
  <div class="funnel-card">
    <div class="form-container">
      <h2 v-if="!isSummary">{{ stepConfig?.title }}</h2>
      <h2 v-else>{{ summary?.title }}</h2>

      <div v-if="stepConfig && !isSummary" class="progress">
        Étape {{ stepConfig.current_step }} sur {{ stepConfig.total_steps }}
      </div>

      <div v-if="formError" class="error">{{ formError }}</div>
      <div v-if="apiError" class="error">{{ apiError }}</div>

      <div v-if="loading" class="loading">Chargement…</div>

      <template v-else-if="!isSummary && stepConfig">
        <StepRenderer
          ref="stepComponentRef"
          :step-config="stepConfig"
          v-model="localData"
          :form-error="formError"
          @error="formError = $event"
        />

        <div class="actions">
          <button v-if="stepConfig.current_step > 1" @click="goToPreviousStep" class="back-btn">
            Retour
          </button>
          <button @click="onNext" class="main-btn">Suivant</button>
        </div>
      </template>

      <template v-else-if="isSummary">
        <div v-if="!summary" class="loading">Chargement du résumé...</div>
        <div v-else class="summary">
          <ul>
            <li v-for="step in summary.steps" :key="step.slug">
              <strong>{{ step.label }}:</strong>
              <span v-if="!step.has_error">{{ step.data }}</span>
              <span v-else class="error">{{ step.error }}</span>
            </li>
          </ul>

          <div v-if="summary.is_valid" class="success">Inscription complète !</div>
          <div v-else class="error">Merci de corriger les erreurs ci-dessus.</div>

          <button @click="goToPreviousStep" class="back-btn">Retour</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import StepRenderer from '@/components/StepRenderer.vue'
import { useRegistration } from '@/composables/useRegistration'
import { fetchSummary } from '@/api/mock'

const {
  currentSlug,
  stepConfig,
  loading,
  error: apiError,
  loadStep,
  submitStep,
} = useRegistration()

const localData = ref<Record<string, unknown>>({})
const isSummary = ref(false)
const summary = ref(null)
const stepComponentRef = ref<any>(null)
const formError = ref<string | null>(null)

onMounted(async () => {
  await loadStep(currentSlug.value)
  if (stepConfig.value) localData.value = { ...stepConfig.value.data }
})

watch(currentSlug, async (slug) => {
  if (slug && !isSummary.value) {
    await loadStep(slug)
    if (stepConfig.value) localData.value = { ...stepConfig.value.data }
    formError.value = null
  }
})

async function onNext() {
  if (isSummary.value) return

  // Appel validation de l'enfant
  if (stepComponentRef.value?.validate) {
    const valid = stepComponentRef.value.validate()
    if (!valid) return
  }

  const response = await submitStep(localData.value)
  if (response && 'next_slug' in response) {
    if (response.next_slug) {
      await loadStep(response.next_slug)
      if (stepConfig.value) localData.value = { ...stepConfig.value.data }
      formError.value = null // Réinitialise l’erreur à chaque étape
    } else {
      isSummary.value = true
      summary.value = null
      try {
        summary.value = await fetchSummary()
      } catch {}
    }
  }
}

async function goToPreviousStep() {
  if (isSummary.value) {
    isSummary.value = false
    summary.value = null
    await loadStep('address')
    formError.value = null // Réinitialise l’erreur
  } else if (stepConfig.value && stepConfig.value.current_step > 1) {
    const slugs = ['personal_information', 'birthdate', 'picture', 'address']
    const idx = stepConfig.value.current_step - 1
    const prevSlug = slugs[idx - 1]
    if (prevSlug) {
      await loadStep(prevSlug)
      if (stepConfig.value) localData.value = { ...stepConfig.value.data }
      formError.value = null // Réinitialise l’erreur
    }
  }
}
</script>

<style scoped>
.actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}
.back-btn {
  background-color: #ccc;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.main-btn {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.success {
  font-weight: bold;
  color: green;
  margin-top: 1rem;
}
.loading {
  font-style: italic;
}
</style>
