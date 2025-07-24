// Mock API Service
export interface StepResponse {
  total_steps: number
  current_step: number
  title: string
  slug: string
  assets: {
    type: string
    fields: Array<{
      name: string
      type: string
      label: string
      required: boolean
      placeholder?: string
    }>
    validation: Record<string, string[]>
  }
  data: Record<string, any>
}

// Données mockées
const mockData: Record<string, StepResponse> = {
  personal_information: {
    total_steps: 4,
    current_step: 1,
    title: 'Informations personnelles',
    slug: 'personal_information',
    assets: {
      type: 'form',
      fields: [
        {
          name: 'first_name',
          type: 'text',
          label: 'Prénom',
          required: true,
          placeholder: 'Votre prénom',
        },
        {
          name: 'last_name',
          type: 'text',
          label: 'Nom',
          required: true,
          placeholder: 'Votre nom',
        },
      ],
      validation: {
        first_name: ['required', 'min:2'],
        last_name: ['required', 'min:2'],
      },
    },
    data: {
      first_name: null,
      last_name: null,
    },
  },
}

// Stockage temporaire des données
const storage: Record<string, Record<string, any>> = {}

class ApiService {
  private delay(ms = 500) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getStep(slug: string): Promise<StepResponse> {
    await this.delay()

    const step = mockData[slug]
    if (!step) {
      throw new Error(`Step ${slug} not found`)
    }

    // Merger avec les données sauvegardées
    const savedData = storage[slug] || {}
    return {
      ...step,
      data: { ...step.data, ...savedData },
    }
  }

  async submitStep(slug: string, data: Record<string, any>): Promise<void> {
    await this.delay()

    // Simulation d'erreur aléatoire (5%)
    if (Math.random() < 0.05) {
      throw new Error('Erreur serveur')
    }

    // Sauvegarder les données
    storage[slug] = data
    console.log(`Step ${slug} saved:`, data)
  }
}

export const apiService = new ApiService()
