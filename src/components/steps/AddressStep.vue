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
      />
      <small id="addressHelp" class="help-text">
        Veuillez saisir une adresse contenant un numéro et du texte (ex: 10 rue de Paris)
      </small>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps<{
  modelValue: { address?: string }
  stepConfig: any
  formError?: string
}>() 
const emit = defineEmits(['update:modelValue', 'submit'])

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

// Synchronisation de l’erreur globale
watch(
  () => props.formError,
  (newVal) => {
    if (newVal !== error.value) error.value = newVal || ''
  },
)

// Regex simple : au moins un ou plusieurs chiffres, puis au moins un caractère texte (lettres, espaces, etc.)
const addressRegex = /^\d+\s+.+$/ // Ex: "10 rue de Paris", "5 Av. Victor Hugo"

function handleSubmit() {
  error.value = ''

  if (!localAddress.value || localAddress.value.trim() === '') {
    error.value = "L'adresse est requise."
    return
  }

  if (!addressRegex.test(localAddress.value.trim())) {
    error.value = "L'adresse doit contenir un numéro suivi de texte (ex: 10 rue de Paris)."
    return
  }

  emit('submit')
}
</script>

<style scoped>
input[type='text'] {
  width: 100%;
  padding: 8px;
  font-size: 1em;
  border-radius: 4px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.help-text {
  font-size: 0.85em;
  color: #666;
  margin-top: 4px;
  display: block;
}
</style>
