<template>
  <div class="registration-view">
    <div v-if="loading" class="loading">
      <p>Chargement...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadStep" class="retry-btn">Réessayer</button>
    </div>

    <div v-else-if="stepData" class="form-container">
      <h1>{{ stepData.title }}</h1>

      <!-- Indicateur de progression simple -->
      <div class="progress">
        <p>Étape {{ stepData.current_step }} sur {{ stepData.total_steps }}</p>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <div v-for="field in stepData.assets.fields" :key="field.name" class="form-row">
            <label :for="field.name">
              {{ field.label }}:
              <span v-if="field.required" class="required">*</span>
            </label>
            <input
              :id="field.name"
              :type="field.type"
              :name="field.name"
              :placeholder="field.placeholder"
              v-model="formData[field.name]"
              :required="field.required"
              :class="{ 'error-border': fieldErrors[field.name] }"
              @blur="validateSingleField(field)"
            />
            <div v-if="fieldErrors[field.name]" class="field-error">
              {{ fieldErrors[field.name] }}
            </div>
          </div>
        </div>

        <button class="main-btn" type="submit" :disabled="submitting">
          {{ submitting ? 'Envoi...' : 'Suivant' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { apiService, type StepResponse } from '../services/api'

// États réactifs
const loading = ref(false)
const error = ref<string | null>(null)
const submitting = ref(false)
const stepData = ref<StepResponse | null>(null)
const formData = reactive<Record<string, string>>({})
const fieldErrors = reactive<Record<string, string>>({})

// Chargement de l'étape
const loadStep = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await apiService.getStep('personal_information')
    stepData.value = data

    // Initialiser le formulaire avec les données existantes
    data.assets.fields.forEach((field) => {
      formData[field.name] = data.data[field.name] || ''
    })
  } catch (err) {
    error.value = 'Erreur lors du chargement'
    console.error('Error loading step:', err)
  } finally {
    loading.value = false
  }
}

// Validation simple
const validateField = (fieldName: string, value: string, rules: string[]): string | null => {
  for (const rule of rules) {
    if (rule === 'required' && (!value || value.trim() === '')) {
      return 'Ce champ est requis'
    }
    if (rule.startsWith('min:')) {
      const minLength = parseInt(rule.split(':')[1])
      if (value.length < minLength) {
        return `Minimum ${minLength} caractères`
      }
    }
  }
  return null
}

// Valide un seul champ au blur
interface Field {
  name: string
  label: string
  type: string
  placeholder?: string
  required?: boolean
}

const validateSingleField = (field: Field) => {
  if (!stepData.value) return
  const rules = stepData.value.assets.validation[field.name] || []
  const error = validateField(field.name, formData[field.name], rules)

  if (error) {
    fieldErrors[field.name] = error
  } else {
    delete fieldErrors[field.name]
  }
}

// Validation du formulaire
const validateForm = (): boolean => {
  if (!stepData.value) return false

  let isValid = true

  // Réinitialiser les erreurs
  Object.keys(fieldErrors).forEach((key) => {
    delete fieldErrors[key]
  })

  // Valider chaque champ
  stepData.value.assets.fields.forEach((field) => {
    const rules = stepData.value!.assets.validation[field.name] || []
    const error = validateField(field.name, formData[field.name], rules)

    if (error) {
      fieldErrors[field.name] = error
      isValid = false
    }
  })

  return isValid
}

// Soumission du formulaire
const handleSubmit = async () => {
  if (!stepData.value || !validateForm()) {
    return
  }

  submitting.value = true

  try {
    await apiService.submitStep(stepData.value.slug, { ...formData })
    alert('Données sauvegardées avec succès !')

    // TODO: Navigation vers l'étape suivante
  } catch (err) {
    error.value = 'Erreur lors de la sauvegarde'
    console.error('Error submitting step:', err)
  } finally {
    submitting.value = false
  }
}

// Chargement initial
onMounted(() => {
  loadStep()
})
</script>

<style scoped lang="scss">

</style>
