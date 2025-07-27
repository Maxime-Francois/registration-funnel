<template>
  <component
    v-if="dynamicStepComponent"
    :is="dynamicStepComponent"
    v-model="model"
    :step-config="props.stepConfig"
    :form-error="formError"
    ref="stepChildRef"
  />
  <form v-else @submit.prevent="handleSubmit" novalidate>
    <div v-for="field in currentFields" :key="field.name" class="form-field">
      <label :for="field.name">{{ field.label }}</label>

      <input
        v-if="['text', 'email', 'date'].includes(field.type)"
        :type="field.type"
        :id="`${props.stepConfig.slug}-${field.name}`"
        :name="field.name"
        :autocomplete="getAutocomplete(field.name)"
        :placeholder="field.placeholder"
        :required="field.required"
        v-model="model[field.name]"
        :class="{ invalid: errors[field.name] }"
      />

      <div v-else-if="field.type === 'file'" class="file-upload-container">
        <input
          type="file"
          :id="`${props.stepConfig.slug}-${field.name}`"
          :name="field.name"
          :accept="getFileAccept(field.name)"
          :required="field.required && !model[field.name]"
          @change="onFileChange($event, field.name)"
          class="file-input"
        />
        <div class="upload-info" v-if="field.name === 'picture'">
          <p>Formats acceptés : JPG, PNG</p>
          <p>Taille max : 2 Mo</p>
        </div>

        <div v-if="filePreviews[field.name]" class="preview-container">
          <img :src="filePreviews[field.name]" alt="Aperçu" class="preview-image" />
          <button type="button" @click="removeFile(field.name)" class="remove-btn">
            Supprimer
          </button>
        </div>

        <div v-if="fileInfos[field.name]" class="file-info">
          <p><strong>Nom:</strong> {{ fileInfos[field.name].name }}</p>
          <p><strong>Taille:</strong> {{ formatFileSize(fileInfos[field.name].size) }}</p>
          <p><strong>Type:</strong> {{ fileInfos[field.name].type }}</p>
        </div>
      </div>

      <div v-if="errors[field.name]" class="error">{{ errors[field.name] }}</div>
    </div>
    <div v-if="formError" class="error">{{ formError }}</div>
  </form>
</template>

<script lang="ts" setup>
import {
  ref,
  computed,
  watch,
  watchEffect,
  nextTick,
  defineProps,
  defineEmits,
  shallowRef,
  defineExpose,
} from 'vue'

import type { StepConfig } from '@/components/types/registration'

const props = defineProps<{ stepConfig: StepConfig; modelValue: Record<string, unknown> }>()
const emit = defineEmits(['update:modelValue', 'submit', 'error']) // Ajout 'error'

const model = ref<Record<string, unknown>>({})
const errors = ref<Record<string, string>>({})
const filePreviews = ref<Record<string, string>>({})
const fileInfos = ref<Record<string, File | null>>({})
const dynamicStepComponent = shallowRef<any>(null)
const formError = ref('')

const currentFields = computed(() => props.stepConfig.assets.fields || [])

watchEffect(() => {
  model.value = { ...props.stepConfig.data, ...props.modelValue }
  nextTick(() => {
    restoreFileStates()
  })
})

watch(model, (val) => emit('update:modelValue', val), { deep: true })

watch(
  () => props.stepConfig.slug,
  async (newSlug) => {
    const compName =
      newSlug.charAt(0).toUpperCase() +
      newSlug.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase()) +
      'Step'
    try {
      dynamicStepComponent.value = (await import(`./steps/${compName}.vue`)).default
    } catch {
      dynamicStepComponent.value = null
    }
    errors.value = {}
  },
  { immediate: true },
)

function restoreFileStates() {
  filePreviews.value = {}
  fileInfos.value = {}
  for (const f of currentFields.value) {
    if (f.type === 'file') {
      const val = model.value[f.name]
      if (val instanceof File) {
        fileInfos.value[f.name] = val
        if (val.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            filePreviews.value[f.name] = e.target?.result as string
          }
          reader.readAsDataURL(val)
        }
      }
    }
  }
}

function getFileAccept(fieldName: string) {
  if (fieldName === 'picture') return 'image/jpeg,image/png'
  return '*/*'
}

function getAutocomplete(fieldName: string) {
  const map: Record<string, string> = {
    first_name: 'given-name',
    last_name: 'family-name',
    email: 'email',
    phone: 'tel',
    address: 'street-address',
    city: 'address-level2',
    postal_code: 'postal-code',
    country: 'country',
    birthdate: 'bday',
  }
  return map[fieldName] || 'off'
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function validateFile(file: File, fieldName: string) {
  if (fieldName === 'picture') {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      errors.value[fieldName] = 'Format non supporté, JPG/PNG uniquement'
      return false
    }
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      errors.value[fieldName] = `Fichier trop volumineux, max ${formatFileSize(maxSize)}`
      return false
    }
  }
  return true
}

function onFileChange(event: Event, fieldName: string) {
  const target = event.target as HTMLInputElement
  errors.value[fieldName] = ''
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!validateFile(file, fieldName)) {
      model.value[fieldName] = null
      filePreviews.value[fieldName] = ''
      fileInfos.value[fieldName] = null
      return
    }
    model.value[fieldName] = file
    fileInfos.value[fieldName] = file
    if (fieldName === 'picture') model.value['fileName'] = file.name
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => (filePreviews.value[fieldName] = e.target?.result as string)
      reader.readAsDataURL(file)
    }
  } else {
    model.value[fieldName] = null
    filePreviews.value[fieldName] = ''
    fileInfos.value[fieldName] = null
    if (fieldName === 'picture') model.value['fileName'] = null
  }
}

function removeFile(fieldName: string) {
  model.value[fieldName] = null
  filePreviews.value[fieldName] = ''
  fileInfos.value[fieldName] = null
  errors.value[fieldName] = ''
  if (fieldName === 'picture') model.value['fileName'] = null
  const input = document.getElementById(`${props.stepConfig.slug}-${fieldName}`) as HTMLInputElement
  if (input) input.value = ''
}

function validate(): boolean {
  errors.value = {}
  let valid = true
  let firstError = '' // Ajout

  for (const field of currentFields.value) {
    const v = model.value[field.name]
    const valRules = props.stepConfig.assets.validation[field.name] || []
    for (const rule of valRules) {
      if (rule === 'required') {
        if (field.type === 'file') {
          if (!v) {
            errors.value[field.name] = 'Ce fichier est requis'
            valid = false
          }
        } else if (!v || (typeof v === 'string' && v.trim() === '')) {
          // Personnalisation pour birthdate
          if (field.name === 'birthdate') {
            errors.value[field.name] = 'La date de naissance est requise.'
          } else {
            errors.value[field.name] = 'Ce champ est requis'
          }
          valid = false
        }
      }
      if (rule.startsWith('min:')) {
        const min = parseInt(rule.split(':')[1])
        if (typeof v === 'string' && v.length < min) {
          errors.value[field.name] = `Minimum ${min} caractères`
          valid = false
        }
      }
      if (rule.startsWith('minAge:')) {
        const minAge = parseInt(rule.split(':')[1])
        if (typeof v === 'string') {
          const today = new Date()
          const birth = new Date(v)
          let age = today.getFullYear() - birth.getFullYear()
          const m = today.getMonth() - birth.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
          if (age < minAge) {
            errors.value[field.name] = `Vous devez avoir au moins ${minAge} ans`
            valid = false
          }
        }
      }
    }
    // Ajout : récupère le premier message d'erreur
    if (!firstError && errors.value[field.name]) {
      firstError = errors.value[field.name]
    }
  }

  emit('error', valid ? '' : firstError) // Ajout : émet l’erreur globale
  return valid
}

defineExpose({ validate })

function handleSubmit() {
  if (validate()) emit('submit')
}
</script>

<style scoped>
.file-upload-container {
  border: 2px dashed #ccc;
  padding: 20px;
  border-radius: 8px;
  margin: 10px 0;
  text-align: center;
}

.upload-info {
  color: #666;
  font-size: 0.9em;
  margin-top: 10px;
}

.preview-container {
  margin: 15px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.remove-btn {
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 15px;
  cursor: pointer;
  margin-top: 10px;
}

.remove-btn:hover {
  background: #d32f2f;
}

.file-info {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
}

.file-info p {
  margin: 5px 0;
  font-size: 0.9em;
}

.invalid {
  border-color: red;
}
</style>
