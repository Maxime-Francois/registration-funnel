<template>
  <div class="funnel">
    <div>
      <h2 v-if="!isSummary">{{ stepConfig?.title }}</h2>
      <h2 v-else>{{ summary?.title }}</h2>

      <!-- Indicateur de progression -->
      <div v-if="stepConfig && !isSummary" class="progress">
        <p>Étape {{ stepConfig.current_step }} sur {{ stepConfig.total_steps }}</p>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
      <div v-else>
        <div v-if="!stepConfig && !isSummary" class="loading">Chargement…</div>
        <template v-else-if="!isSummary">
          <StepRenderer
            v-if="stepConfig && stepConfig.assets"
            :step-config="stepConfig"
            v-model="localData"
            @submit="onSubmitStep"
          />
          <!-- Bouton retour sauf sur la première étape -->
          <button
            v-if="stepConfig && stepConfig.current_step > 1"
            @click="goToPreviousStep"
            class="back-btn"
          >
            Retour
          </button>
        </template>
        <template v-else>
          <div v-if="!summary" class="loading">Chargement du récapitulatif…</div>
          <div v-else class="summary">
            <ul>
              <li v-for="step in summary.steps" :key="step.slug">
                <strong>{{ step.label }} :</strong>
                <span v-if="!step.has_error">
                  <!-- Affichage normal pour tous les champs -->
                  <span>{{ step.data }}</span>
                </span>
                <span v-else class="error">{{ step.error }}</span>
              </li>
            </ul>
            <div v-if="summary.is_valid" class="success">Inscription complète !</div>
            <div v-else class="error">Merci de corriger les erreurs ci-dessus.</div>
            <!-- Bouton retour sur le résumé -->
            <button @click="goToPreviousStep" class="back-btn">Retour</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import { useRegistration } from '@/composables/useRegistration'
import StepRenderer from './StepRenderer.vue'
import { fetchSummary } from '@/api/mock'
import type { RegistrationSummary } from '@/components/types/registration'

const { currentSlug, stepConfig, loading, error, loadStep, submitStep } = useRegistration()
const localData = ref<Record<string, unknown>>({})
const isSummary = ref(false)
const summary = ref<RegistrationSummary | null>(null)

watchEffect(() => {
  if (currentSlug.value && !isSummary.value) {
    loadStep(currentSlug.value).then(() => {
      if (stepConfig.value) localData.value = { ...stepConfig.value.data }
    })
  }
})

async function onSubmitStep() {
  const response = await submitStep(localData.value)
  if (response && 'next_slug' in response) {
    const nextSlug = response.next_slug
    if (nextSlug) {
      await loadStep(nextSlug)
    } else {
      // Afficher le résumé dans le funnel
      isSummary.value = true
      summary.value = null
      try {
        summary.value = await fetchSummary()
      } catch {
        // Gérer l'erreur si besoin
      }
    }
  }
}

async function goToPreviousStep() {
  if (isSummary.value) {
    // Retour à la dernière étape depuis le résumé
    isSummary.value = false
    summary.value = null
    // En vrai, l'API devrait retourner le slug de l'étape précédente
    await loadStep('address') // Simulation pour le mock
  } else if (stepConfig.value && stepConfig.value.current_step > 1) {
    // Retour à l'étape précédente
    const previousStep = stepConfig.value.current_step - 1
    // En vrai, l'API devrait retourner le slug de l'étape précédente
    // Pour le mock, on simule
    const slugs = ['personal_information', 'birthdate', 'picture', 'address']
    const previousSlug = slugs[previousStep - 1]
    if (previousSlug) {
      await loadStep(previousSlug)
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
