<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-field">
      <label for="birthdate">Date de naissance</label>
      <input id="birthdate" type="date" v-model="local.birthdate" required />
      <div v-if="error" class="error">{{ error }}</div>
    </div>
    <button type="submit">Suivant</button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps<{ modelValue: { birthdate?: string }; stepConfig: any }>()
const emit = defineEmits(['update:modelValue', 'submit'])
const local = ref({ ...props.modelValue })
const error = ref('')

watch(local, (v) => emit('update:modelValue', v), { deep: true })

function getAge(dateString: string) {
  const today = new Date()
  const birth = new Date(dateString)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function handleSubmit() {
  error.value = ''
  if (!local.value.birthdate) {
    error.value = 'Date requise'
    return
  }
  if (getAge(local.value.birthdate) < 18) {
    error.value = 'Vous devez avoir au moins 18 ans.'
    return
  }
  emit('submit')
}
</script>