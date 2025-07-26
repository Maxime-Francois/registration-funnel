<template>
  <component
    v-if="dynamicStepComponent"
    :is="dynamicStepComponent"
    v-model="model"
    :step-config="props.stepConfig"
    @submit="handleSubmit"
  />
  <form v-else @submit.prevent="handleSubmit" :key="`form-${props.stepConfig.slug}`">
    <div
      v-for="field in currentFields"
      :key="`${props.stepConfig.slug}-${field.name}`"
      class="form-field"
    >
      <label :for="`${props.stepConfig.slug}-${field.name}`">{{ field.label }}</label>
      <input
        v-if="field.type === 'text' || field.type === 'email' || field.type === 'date'"
        :type="field.type"
        :id="`${props.stepConfig.slug}-${field.name}`"
        :name="field.name"
        :autocomplete="getAutocomplete(field.name)"
        :placeholder="field.placeholder"
        :required="field.required"
        v-model="model[field.name]"
      />
      <!-- Amélioration du fallback pour les fichiers -->
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
        <div class="upload-info">
          <p v-if="field.name === 'picture'">Formats acceptés : JPG, PNG</p>
          <p v-if="field.name === 'picture'">Taille maximum : 2 Mo</p>
        </div>

        <!-- Preview pour les images -->
        <div v-if="filePreviews[field.name]" class="preview-container">
          <img :src="filePreviews[field.name]" alt="Aperçu" class="preview-image" />
          <button type="button" @click="removeFile(field.name)" class="remove-btn">
            Supprimer
          </button>
        </div>

        <!-- Informations sur le fichier -->
        <div v-if="fileInfos[field.name]" class="file-info">
          <p><strong>Fichier :</strong> {{ fileInfos[field.name].name }}</p>
          <p><strong>Taille :</strong> {{ formatFileSize(fileInfos[field.name].size) }}</p>
          <p><strong>Type :</strong> {{ fileInfos[field.name].type }}</p>
        </div>
      </div>
      <div v-if="errors[field.name]" class="error">{{ errors[field.name] }}</div>
    </div>
    <button type="submit">Suivant</button>
  </form>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits, shallowRef, onMounted, computed, watchEffect, nextTick } from 'vue'
import type { StepConfig } from '@/components/types/registration'

const props = defineProps<{
  stepConfig: StepConfig
  modelValue: Record<string, unknown>
}>()
const emit = defineEmits(['update:modelValue', 'submit'])

// CORRECTION : Réinitialiser le modèle quand stepConfig change
const model = ref<Record<string, unknown>>({})

// Watcher pour réinitialiser le modèle quand l'étape change
watchEffect(() => {
  // Fusionner les données de l'étape avec les valeurs actuelles du modelValue
  model.value = {
    ...props.stepConfig.data, // Données par défaut de l'étape
    ...props.modelValue // Données actuelles (peut écraser les défauts)
  }

  // Restaurer l'état visuel des fichiers après mise à jour du modèle
  nextTick(() => {
    restoreFileStates()
  })
})

// Dynamique : charge un composant spécifique si il existe
const dynamicStepComponent = shallowRef<any>(null)
const dynamicComponentName = computed(() => {
  // Ex: birthdate => BirthdateStep
  const slug = props.stepConfig.slug
  return (
    slug.charAt(0).toUpperCase() +
    slug.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase()) +
    'Step'
  )
})

// Gestion des fichiers pour le fallback
const filePreviews = ref<Record<string, string>>({})
const fileInfos = ref<Record<string, File>>({})
// Computed pour s'assurer que les champs sont bien réactifs
const currentFields = computed(() => {
  return props.stepConfig.assets.fields || []
})

const errors = ref<Record<string, string>>({})

// Watcher pour nettoyer les états de fichiers quand l'étape change
watch(() => props.stepConfig.slug, () => {
  // Ne pas nettoyer automatiquement, laisser restoreFileStates() s'en charger
  errors.value = {}
}, { immediate: true })

// Fonction pour restaurer l'état visuel des fichiers
function restoreFileStates() {
  // Nettoyer d'abord
  filePreviews.value = {}
  fileInfos.value = {}

  // Restaurer pour chaque champ de type file de l'étape courante
  for (const field of props.stepConfig.assets.fields) {
    if (field.type === 'file') {
      const fileValue = model.value[field.name]
      if (fileValue && fileValue instanceof File) {
        // Restaurer fileInfo
        fileInfos.value[field.name] = fileValue

        // Restaurer preview pour les images
        if (fileValue.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            filePreviews.value[field.name] = e.target?.result as string
          }
          reader.readAsDataURL(fileValue)
        }
      }
    }
  }
}

watch(
  () => props.stepConfig.slug,
  async (newSlug) => {
    const componentName =
      newSlug.charAt(0).toUpperCase() +
      newSlug.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase()) +
      'Step'
    try {
      dynamicStepComponent.value = (await import(`./steps/${componentName}.vue`)).default

    } catch {
      dynamicStepComponent.value = null
    }
  },
  { immediate: true }
)

// Répercuter la modif sur le parent
watch(model, (value) => emit('update:modelValue', value), { deep: true })

function getFileAccept(fieldName: string): string {
  if (fieldName === 'picture') return 'image/jpeg,image/png'
  return '*/*'
}

function getAutocomplete(fieldName: string): string {
  // Mapping des noms de champs vers les valeurs autocomplete standard
  const autocompleteMap: Record<string, string> = {
    'first_name': 'given-name',
    'last_name': 'family-name',
    'email': 'email',
    'phone': 'tel',
    'address': 'street-address',
    'city': 'address-level2',
    'postal_code': 'postal-code',
    'country': 'country',
    'birthdate': 'bday'
  }

  return autocompleteMap[fieldName] || 'off'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function validateFile(file: File, fieldName: string): boolean {
  if (fieldName === 'picture') {
    // Validation du type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      errors.value[fieldName] = 'Format non supporté. Veuillez sélectionner un fichier JPG ou PNG.'
      return false
    }

    // Validation de la taille (2 Mo)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      errors.value[fieldName] =
        `Fichier trop volumineux. Taille maximum : ${formatFileSize(maxSize)}`

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

    // AJOUT : Stocker le nom du fichier pour l'étape picture
    if (fieldName === 'picture') {
      model.value['fileName'] = file.name
    }

    // Créer la preview pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        filePreviews.value[fieldName] = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  } else {
    model.value[fieldName] = null
    filePreviews.value[fieldName] = ''
    fileInfos.value[fieldName] = null

    // AJOUT : Nettoyer le fileName aussi
    if (fieldName === 'picture') {
      model.value['fileName'] = null
    }
  }
}

function removeFile(fieldName: string) {
  model.value[fieldName] = null
  filePreviews.value[fieldName] = ''
  fileInfos.value[fieldName] = null
  errors.value[fieldName] = ''

  // AJOUT : Nettoyer le fileName
  if (fieldName === 'picture') {
    model.value['fileName'] = null
  }

  // Reset l'input file
  const fileInput = document.getElementById(fieldName) as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

function handleSubmit() {
  errors.value = {}
  let valid = true
  for (const field of currentFields.value) {
    const value = model.value[field.name]
    const rules = props.stepConfig.assets.validation[field.name] || []
    for (const rule of rules) {
      if (rule === 'required') {
        // Pour les champs file, vérifier s'il y a un fichier OU s'il y en avait déjà un
        if (field.type === 'file') {
          if (!value) {
            errors.value[field.name] = 'Ce fichier est requis'
            valid = false
          }
        } else {
          // Pour les autres champs
          if (!value || value.trim() === '') {
            errors.value[field.name] = 'Ce champ est requis'
            valid = false
          }
        }
      }
      if (rule.startsWith('min:')) {
        const min = parseInt(rule.split(':')[1])
        if (value && typeof value === 'string' && value.length < min) {
          errors.value[field.name] = `Minimum ${min} caractères`;
          valid = false
        }
      }
      if (rule.startsWith('minAge:')) {
        const minAge = parseInt(rule.split(':')[1])
        if (value && typeof value === 'string') {
          const today = new Date()
          const birth = new Date(value)
          let age = today.getFullYear() - birth.getFullYear()
          const m = today.getMonth() - birth.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--
          }
          if (age < minAge) {
            errors.value[field.name] = `Vous devez avoir au moins ${minAge} ans`
            valid = false
          }
        }
      }
    }
  }
  if (valid) emit('submit')
}
</script>

<style scoped>
.file-upload-container {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  margin: 10px 0;
}

.upload-info {
  margin-top: 10px;
  color: #666;
  font-size: 0.9em;
}

.upload-info p {
  margin: 5px 0;
}

.preview-container {
  margin: 15px 0;
  text-align: center;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.remove-btn {
  margin-top: 10px;
  padding: 5px 15px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn:hover {
  background: #cc0000;
}

.file-info {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.file-info p {
  margin: 5px 0;
  font-size: 0.9em;
}

.error {
  color: #ff4444;
  margin-top: 10px;
  font-weight: bold;
}
</style>
