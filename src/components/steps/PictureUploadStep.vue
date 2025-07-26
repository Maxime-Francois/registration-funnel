<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-field">
      <label for="picture">Photo de profil</label>
      <div class="file-upload-container">
        <input
          id="picture"
          type="file"
          accept="image/jpeg,image/png"
          @change="onFileChange"
          :required="!local.picture"
          class="file-input"
        />
        <div class="upload-info">
          <p>Formats acceptés : JPG, PNG</p>
          <p>Taille maximum : 2 Mo</p>
        </div>
      </div>

      <!-- Preview de l'image -->
      <div v-if="preview" class="preview-container">
        <img :src="preview" alt="Aperçu de la photo" class="preview-image" />
        <button type="button" @click="removeImage" class="remove-btn">Supprimer</button>
      </div>

      <!-- Informations sur le fichier -->
      <div v-if="fileInfo" class="file-info">
        <p><strong>Fichier :</strong> {{ fileInfo.name }}</p>
        <p><strong>Taille :</strong> {{ formatFileSize(fileInfo.size) }}</p>
        <p><strong>Type :</strong> {{ fileInfo.type }}</p>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
    </div>
    <button type="submit" :disabled="!local.picture">Suivant</button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, watchEffect, nextTick } from 'vue'

const props = defineProps<{ modelValue: { picture?: File | string }; stepConfig: any }>()
const emit = defineEmits(['update:modelValue', 'submit'])
const local = ref({ ...props.modelValue })
const error = ref('')
const preview = ref<string | null>(null)
const fileInfo = ref<File | null>(null)

// Ajout d'une ref pour stocker le nom du fichier
const fileName = ref<string | null>(null)

// Watcher pour restaurer l'état quand modelValue change (retour en arrière)
watchEffect(() => {
  // Mettre à jour le modèle local
  local.value = { ...props.modelValue }

  // Restaurer l'état visuel après la mise à jour
  nextTick(() => {
    restoreFileState()
  })
})

// Fonction pour restaurer l'état visuel du fichier
function restoreFileState() {
  if (local.value.picture && local.value.picture instanceof File) {
    // Restaurer fileInfo
    fileInfo.value = local.value.picture
    fileName.value = local.value.picture.name

    // Recréer la preview
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.value = e.target?.result as string
    }
    reader.readAsDataURL(local.value.picture)
  } else {
    // Nettoyer l'état si pas de fichier
    preview.value = null
    fileInfo.value = null
    fileName.value = null
  }
}

watch(local, (v) => emit('update:modelValue', v), { deep: true })

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function validateFile(file: File): boolean {
  // Validation du type
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    error.value = 'Format non supporté. Veuillez sélectionner un fichier JPG ou PNG.'
    return false
  }

  // Validation de la taille (2 Mo = 2 * 1024 * 1024 bytes)
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = Fichier trop volumineux. Taille maximum : ${formatFileSize(maxSize)}
    return false
  }

  return true
}

function onFileChange(e: Event) {
  error.value = ''
  const file = (e.target as HTMLInputElement).files?.[0]

  if (!file) {
    local.value.picture = undefined
    preview.value = null
    fileInfo.value = null
    fileName.value = null
    return
  }

  if (!validateFile(file)) {
    local.value.picture = undefined
    preview.value = null
    fileInfo.value = null
    fileName.value = null
    return
  }

  // Fichier valide
  local.value.picture = file
  fileInfo.value = file
  fileName.value = file.name // Stocker le nom du fichier

  // Créer la preview
  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Mettre à jour le modèle avec le nom du fichier aussi
  const updatedModel = {
    ...local.value,
    picture: file,
    fileName: file.name, // Ajouter le nom du fichier au modèle
  }
  local.value = updatedModel
}

function removeImage() {
  local.value.picture = undefined
  preview.value = null
  fileInfo.value = null
  fileName.value = null
  error.value = ''

  // Reset l'input file
  const fileInput = document.getElementById('picture') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

function handleSubmit() {
  error.value = ''
  if (!local.value.picture) {
    error.value = 'Veuillez sélectionner une photo de profil.'
    return
  }
  emit('submit')
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