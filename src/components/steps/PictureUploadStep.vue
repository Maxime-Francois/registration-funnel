<template>
  <div class="content-area">
    <div class="form-field file-field" :class="{ 'has-preview': preview }">
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

      <!-- Preview de l'image avec hauteur stable -->
      <div class="preview-container">
        <div v-if="preview">
          <img :src="preview" alt="Aperçu de la photo" class="preview-image" />
          <button type="button" @click="removeImage" class="remove-btn">Supprimer</button>
        </div>
      </div>

      <!-- Informations sur le fichier -->
      <div v-if="fileInfo" class="file-info">
        <p><strong>Fichier :</strong> {{ fileInfo.name }}</p>
        <p><strong>Taille :</strong> {{ formatFileSize(fileInfo.size) }}</p>
        <p><strong>Type :</strong> {{ fileInfo.type }}</p>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, watchEffect, nextTick } from 'vue'

const props = defineProps<{ modelValue: { picture?: File | string }; stepConfig: any }>()
const emit = defineEmits(['update:modelValue', 'submit'])
const local = ref({ ...props.modelValue })
const error = ref('')
const preview = ref<string | null>(null)
const fileInfo = ref<File | null>(null)

const fileName = ref<string | null>(null)

watchEffect(() => {
  local.value = { ...props.modelValue }
  nextTick(() => {
    restoreFileState()
  })
})

function restoreFileState() {
  if (local.value.picture && local.value.picture instanceof File) {
    fileInfo.value = local.value.picture
    fileName.value = local.value.picture.name

    const reader = new FileReader()
    reader.onload = (e) => {
      preview.value = e.target?.result as string
    }
    reader.readAsDataURL(local.value.picture)
  } else {
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
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    error.value = 'Format non supporté. Veuillez sélectionner un fichier JPG ou PNG.'
    return false
  }

  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = `Fichier trop volumineux. Taille maximum : ${formatFileSize(maxSize)}`
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

  local.value.picture = file
  fileInfo.value = file
  fileName.value = file.name

  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  const updatedModel = {
    ...local.value,
    picture: file,
    fileName: file.name,
  }
  local.value = updatedModel
}

function removeImage() {
  local.value.picture = undefined
  preview.value = null
  fileInfo.value = null
  fileName.value = null
  error.value = ''

  const fileInput = document.getElementById('picture') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

