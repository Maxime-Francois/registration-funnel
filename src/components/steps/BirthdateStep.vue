<template>
  <div class="form-field">
    <label for="birthdate">Date de naissance</label>
    <input
      type="date"
      id="birthdate"
      v-model="localBirthdate"
      required
      :class="{ invalid: error }"
      autocomplete="bday"
      placeholder="JJ/MM/AAAA"
    />
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, defineExpose } from 'vue'

const props = defineProps<{
  modelValue: { birthdate?: string }
  stepConfig: any
  formError?: string 
}>()
const emit = defineEmits(['update:modelValue', 'error'])

const error = ref('')
const localBirthdate = ref(props.modelValue.birthdate || '')

// Synchronisation de l’erreur globale
watch(
  () => props.formError,
  (newVal) => {
    if (newVal !== error.value) error.value = newVal || ''
  },
)

// Synchronisation quand props.modelValue.birthdate change (ex: reset)
watch(
  () => props.modelValue.birthdate,
  (newVal) => {
    if (newVal !== localBirthdate.value) {
      localBirthdate.value = newVal || ''
    }
  },
)

// Synchronisation locale => parent (update:modelValue)
watch(localBirthdate, (newVal) => {
  emit('update:modelValue', { birthdate: newVal })
})

function getAge(dateStr: string): number {
  if (!dateStr) return 0
  const today = new Date()
  const birth = new Date(dateStr)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Méthode de validation exposée au parent
function validate(): boolean {
  error.value = ''
  if (!localBirthdate.value || localBirthdate.value.trim() === '') {
    error.value = 'La date de naissance est requise.'
    emit('error', error.value)
    return false
  }
  if (getAge(localBirthdate.value) < 18) {
    error.value = 'Vous devez avoir au moins 18 ans.'
    emit('error', error.value)
    return false
  }
  emit('error', '')
  return true
}

defineExpose({ validate })
</script>

<style scoped>

</style>
