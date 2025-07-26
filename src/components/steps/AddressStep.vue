<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-field">
      <label for="address">Adresse</label>
      <input
        id="address"
        type="text"
        v-model="local.address"
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
    <button type="submit">Suivant</button>
  </form>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watchEffect } from 'vue'

const props = defineProps<{ modelValue: { address?: string }; stepConfig: any }>()
const emit = defineEmits(['update:modelValue', 'submit'])

const local = ref<{ address?: string }>({ ...props.modelValue })
const error = ref('')

// Synchronisation props -> local
watchEffect(() => {
  local.value = { ...props.modelValue }
})

// Synchronisation local -> parent
watchEffect(() => {
  emit('update:modelValue', local.value)
})

// Regex simple : au moins un ou plusieurs chiffres, puis au moins un caractère texte (lettres, espaces, etc.)
const addressRegex = /^\d+\s+.+$/ // ex: "10 rue de Paris", "5 Av. Victor Hugo"

function handleSubmit() {
  error.value = ''

  if (!local.value.address || local.value.address.trim() === '') {
    error.value = "L'adresse est requise."
    return
  }

  if (!addressRegex.test(local.value.address.trim())) {
    error.value = "L'adresse doit contenir un numéro suivi de texte (ex: 10 rue de Paris)."
    return
  }

  emit('submit')
}
</script>

<style scoped>
.form-field {
  margin-bottom: 1rem;
}

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

.error {
  color: #ff4444;
  margin-top: 8px;
  font-weight: bold;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  padding: 10px 20px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #999;
  cursor: not-allowed;
}
</style>
