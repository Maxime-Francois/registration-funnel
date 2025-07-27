<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-field">
      <label for="address">Adresse</label>
      <input
        id="address"
        type="text"
        v-model="localAddress"
        autocomplete="street-address"
        placeholder="Ex: 10 rue de Paris"
        required
        aria-describedby="addressHelp"
        :class="{ invalid: error }"
      />
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, defineExpose } from 'vue'

const props = defineProps<{
  modelValue: { address?: string }
  stepConfig: any
  formError?: string
}>()

const emit = defineEmits(['update:modelValue', 'submit', 'error'])

const error = ref('')

// Local state for address
const localAddress = ref(props.modelValue.address || '')

// Synchronisation quand props.modelValue.address change (ex: reset)
watch(
  () => props.modelValue.address,
  (newAddress) => {
    if (newAddress !== localAddress.value) {
      localAddress.value = newAddress || ''
    }
  },
)

// Synchronisation locale => parent (update:modelValue)
watch(localAddress, (newVal) => {
  emit('update:modelValue', { address: newVal })
})

// Synchronisation de l'erreur globale
watch(
  () => props.formError,
  (newVal) => {
    if (newVal !== error.value) error.value = newVal || ''
  },
)

// Regex pour l'adresse
const addressRegex = /^\d+\s+[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*$/

function validate(): boolean {
  error.value = ''

  if (!localAddress.value || localAddress.value.trim() === '') {
    error.value = "L'adresse est requise."
    emit('error', error.value)
    return false
  }

  if (!addressRegex.test(localAddress.value.trim())) {
    error.value = "L'adresse doit contenir un numéro suivi de texte (ex: 10 rue de Paris)."
    emit('error', error.value)
    return false
  }

  emit('error', '') // Pas d'erreur
  return true
}

function handleSubmit() {
  if (validate()) {
    emit('submit')
  }
}

// Exposer la méthode validate pour que le parent puisse l'appeler
defineExpose({ validate })
</script>

<style scoped>
.form-field {
  margin-bottom: 1rem;
}

.invalid {
  border-color: #dc3545;
}

.error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
